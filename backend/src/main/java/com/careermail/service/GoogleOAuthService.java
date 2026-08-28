package com.careermail.service;

import com.careermail.model.entity.ConnectedAccount;
import com.careermail.model.entity.User;
import com.careermail.repository.ConnectedAccountRepository;
import com.careermail.repository.UserRepository;
import com.careermail.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class GoogleOAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleOAuthService.class);

    private static final String GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
    private static final String GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

    private final ConnectedAccountRepository connectedAccountRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final RestTemplate restTemplate;

    @Value("${careermail.google.client-id:}")
    private String clientId;

    @Value("${careermail.google.client-secret:}")
    private String clientSecret;

    @Value("${careermail.google.redirect-uri:http://localhost:8080/api/auth/google/callback}")
    private String redirectUri;

    @Value("${careermail.google.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    public GoogleOAuthService(ConnectedAccountRepository connectedAccountRepository,
                              UserRepository userRepository,
                              JwtService jwtService) {
        this.connectedAccountRepository = connectedAccountRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.restTemplate = new RestTemplate();
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
    }

    public String getRedirectUri() {
        return redirectUri;
    }

    public String getFrontendUrl() {
        return frontendUrl;
    }

    public String generateAuthorizationUrl(String stateParam) {
        String state = (stateParam != null && !stateParam.isBlank()) ? stateParam : UUID.randomUUID().toString();
        String scopes = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";

        return GOOGLE_AUTH_ENDPOINT + "?" +
                "client_id=" + URLEncoder.encode(clientId != null ? clientId : "", StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(redirectUri != null ? redirectUri : "", StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode(scopes, StandardCharsets.UTF_8) +
                "&access_type=offline" +
                "&prompt=consent" +
                "&include_granted_scopes=true" +
                "&state=" + URLEncoder.encode(state, StandardCharsets.UTF_8);
    }

    @Transactional
    public OAuthCallbackResult handleOAuthCallback(String code, String state) {
        if (!isConfigured()) {
            throw new IllegalStateException("Google OAuth client is not configured on the server. Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
        }

        // 1. Exchange code for tokens
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("redirect_uri", redirectUri);
        body.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ParameterizedTypeReference<Map<String, Object>> mapType = new ParameterizedTypeReference<>() {};
        ResponseEntity<Map<String, Object>> tokenResponse = restTemplate.exchange(GOOGLE_TOKEN_ENDPOINT, HttpMethod.POST, request, mapType);
        if (!tokenResponse.getStatusCode().is2xxSuccessful() || tokenResponse.getBody() == null) {
            throw new RuntimeException("Failed to exchange code with Google OAuth token endpoint");
        }

        Map<String, Object> tokenData = tokenResponse.getBody();
        String accessToken = (String) tokenData.get("access_token");
        String refreshToken = (String) tokenData.get("refresh_token");
        Number expiresIn = (Number) tokenData.get("expires_in");
        String scope = (String) tokenData.get("scope");

        // 2. Fetch Google User Profile
        HttpHeaders authHeaders = new HttpHeaders();
        authHeaders.setBearerAuth(accessToken);
        HttpEntity<Void> userinfoReq = new HttpEntity<>(authHeaders);

        ResponseEntity<Map<String, Object>> userinfoResp = restTemplate.exchange(GOOGLE_USERINFO_ENDPOINT, HttpMethod.GET, userinfoReq, mapType);
        if (!userinfoResp.getStatusCode().is2xxSuccessful() || userinfoResp.getBody() == null) {
            throw new RuntimeException("Failed to retrieve Google user profile info");
        }

        Map<String, Object> userInfo = userinfoResp.getBody();
        String googleSub = (String) userInfo.get("sub");
        String googleEmail = (String) userInfo.get("email");
        String googleName = (String) userInfo.get("name");
        String googlePicture = (String) userInfo.get("picture");

        // 3. Match or Create User
        User user = null;

        // Check if state holds user token or id if passed from frontend
        if (state != null && state.startsWith("user:")) {
            try {
                Long userId = Long.parseLong(state.substring(5));
                user = userRepository.findById(userId).orElse(null);
            } catch (Exception ignored) {}
        }

        if (user == null && googleEmail != null) {
            user = userRepository.findByEmail(googleEmail.toLowerCase()).orElse(null);
        }

        if (user == null) {
            // Create user account from Google profile
            user = new User();
            user.setName(googleName != null ? googleName : "Google User");
            user.setEmail(googleEmail != null ? googleEmail.toLowerCase() : "google_" + googleSub + "@careermail.io");
            user.setPassword(UUID.randomUUID().toString()); // Secure random password
            user.setAvatarUrl(googlePicture != null ? googlePicture : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
            user = userRepository.save(user);
        }

        // 4. Save or Update ConnectedAccount
        ConnectedAccount account = connectedAccountRepository.findByUserAndProvider(user, "google")
                .orElse(new ConnectedAccount());

        account.setUser(user);
        account.setProvider("google");
        account.setProviderEmail(googleEmail);
        account.setProviderAccountId(googleSub);
        account.setAccessToken(accessToken);
        if (refreshToken != null && !refreshToken.isBlank()) {
            account.setRefreshToken(refreshToken);
        }
        if (expiresIn != null) {
            account.setTokenExpiry(LocalDateTime.now().plusSeconds(expiresIn.longValue() - 60));
        }
        account.setScope(scope);
        connectedAccountRepository.save(account);

        String jwt = jwtService.generateToken(user.getEmail());
        return new OAuthCallbackResult(user, account, jwt);
    }

    @Transactional
    public String forceRefreshToken(ConnectedAccount account) {
        if (account.getRefreshToken() == null || account.getRefreshToken().isBlank()) {
            log.warn("Cannot refresh token: refresh token is null/blank for account {}", account.getProviderEmail());
            return account.getAccessToken();
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);
            body.add("refresh_token", account.getRefreshToken());
            body.add("grant_type", "refresh_token");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ParameterizedTypeReference<Map<String, Object>> mapType = new ParameterizedTypeReference<>() {};
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(GOOGLE_TOKEN_ENDPOINT, HttpMethod.POST, request, mapType);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> data = response.getBody();
                String newAccessToken = (String) data.get("access_token");
                Number expiresIn = (Number) data.get("expires_in");

                account.setAccessToken(newAccessToken);
                if (expiresIn != null) {
                    account.setTokenExpiry(LocalDateTime.now().plusSeconds(expiresIn.longValue() - 60));
                }
                connectedAccountRepository.save(account);
                log.info("Successfully refreshed Google OAuth access token for {}", account.getProviderEmail());
                return newAccessToken;
            }
        } catch (Exception e) {
            log.error("Failed to force refresh Google OAuth access token for {}: {}", account.getProviderEmail(), e.getMessage());
        }

        return account.getAccessToken();
    }

    @Transactional
    public String getValidAccessToken(ConnectedAccount account) {
        if (account.getTokenExpiry() != null && account.getTokenExpiry().isAfter(LocalDateTime.now())) {
            return account.getAccessToken();
        }

        return forceRefreshToken(account);
    }

    public static class OAuthCallbackResult {
        public final User user;
        public final ConnectedAccount account;
        public final String jwt;

        public OAuthCallbackResult(User user, ConnectedAccount account, String jwt) {
            this.user = user;
            this.account = account;
            this.jwt = jwt;
        }
    }
}

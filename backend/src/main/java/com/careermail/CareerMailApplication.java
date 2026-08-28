package com.careermail;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
public class CareerMailApplication {

    public static void main(String[] args) {
        loadEnvIfPresent();
        SpringApplication.run(CareerMailApplication.class, args);
    }

    private static void loadEnvIfPresent() {
        String[] possibleEnvPaths = {"../.env", ".env", "../../.env"};
        for (String path : possibleEnvPaths) {
            File f = new File(path);
            if (f.exists() && f.isFile()) {
                try {
                    List<String> lines = Files.readAllLines(Paths.get(f.getAbsolutePath()));
                    for (String line : lines) {
                        line = line.trim();
                        if (!line.isEmpty() && !line.startsWith("#") && line.contains("=")) {
                            int eqIdx = line.indexOf('=');
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {}
            }
        }
    }
}

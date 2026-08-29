package com.careermail.dto;

import java.util.List;

public class AssistantQueryResponse {

    private String reply;
    private List<String> suggestions;
    private List<AssistantCardDTO> cards;
    private AssistantEmailDraftDTO emailDraft;
    private Object data;

    public AssistantQueryResponse() {}

    public AssistantQueryResponse(String reply, List<String> suggestions, Object data) {
        this.reply = reply;
        this.suggestions = suggestions;
        this.data = data;
    }

    public AssistantQueryResponse(String reply, List<String> suggestions, List<AssistantCardDTO> cards,
                                  AssistantEmailDraftDTO emailDraft, Object data) {
        this.reply = reply;
        this.suggestions = suggestions;
        this.cards = cards;
        this.emailDraft = emailDraft;
        this.data = data;
    }

    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public List<String> getSuggestions() { return suggestions; }
    public void setSuggestions(List<String> suggestions) { this.suggestions = suggestions; }

    public List<AssistantCardDTO> getCards() { return cards; }
    public void setCards(List<AssistantCardDTO> cards) { this.cards = cards; }

    public AssistantEmailDraftDTO getEmailDraft() { return emailDraft; }
    public void setEmailDraft(AssistantEmailDraftDTO emailDraft) { this.emailDraft = emailDraft; }

    public Object getData() { return data; }
    public void setData(Object data) { this.data = data; }
}

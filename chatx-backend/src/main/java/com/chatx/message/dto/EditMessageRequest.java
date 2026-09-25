package com.chatx.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class EditMessageRequest {

    @NotBlank(message = "Message content cannot be blank")
    @Size(max = 10000, message = "Message content must not exceed 10000 characters")
    private String content;

    public EditMessageRequest() {}

    public EditMessageRequest(String content) {
        this.content = content;
    }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}

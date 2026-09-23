package com.chatx.user.dto;

import com.chatx.user.enums.MessagePrivacy;
import jakarta.validation.constraints.NotNull;

public class UpdatePrivacyRequest {

    @NotNull(message = "Message privacy setting is required")
    private MessagePrivacy messagePrivacy;

    public UpdatePrivacyRequest() {
    }

    public UpdatePrivacyRequest(MessagePrivacy messagePrivacy) {
        this.messagePrivacy = messagePrivacy;
    }

    public MessagePrivacy getMessagePrivacy() {
        return messagePrivacy;
    }

    public void setMessagePrivacy(MessagePrivacy messagePrivacy) {
        this.messagePrivacy = messagePrivacy;
    }
}

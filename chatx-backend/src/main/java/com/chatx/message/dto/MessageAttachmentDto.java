package com.chatx.message.dto;

import java.util.UUID;

public class MessageAttachmentDto {
    private UUID id;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;

    public MessageAttachmentDto() {}

    public MessageAttachmentDto(UUID id, String fileName, String fileUrl, String fileType, Long fileSize) {
        this.id = id;
        this.fileName = fileName;
        this.fileUrl = fileUrl;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
}

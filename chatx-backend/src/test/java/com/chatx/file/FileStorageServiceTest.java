package com.chatx.file;

import com.chatx.common.exception.BadRequestException;
import com.chatx.file.dto.FileUploadResponse;
import com.chatx.file.service.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService fileStorageService;

    @BeforeEach
    void setUp() {
        fileStorageService = new FileStorageService(
                tempDir.toString(),
                10,
                "image/jpeg,image/png,application/pdf"
        );
        fileStorageService.init();
    }

    @Test
    @DisplayName("Store valid image file successfully")
    void storeFile_Success() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test-image.png",
                "image/png",
                "dummy image content".getBytes()
        );

        FileUploadResponse response = fileStorageService.storeFile(file);

        assertThat(response).isNotNull();
        assertThat(response.getFileName()).contains("test-image.png");
        assertThat(response.getFileUrl()).startsWith("/api/files/");
        assertThat(response.getFileType()).isEqualTo("image/png");
        assertThat(response.getFileSize()).isEqualTo("dummy image content".length());

        Resource resource = fileStorageService.loadFileAsResource(response.getFileName());
        assertThat(resource.exists()).isTrue();
    }

    @Test
    @DisplayName("Store file with disallowed content type throws BadRequestException")
    void storeFile_DisallowedType_ThrowsBadRequest() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "malicious.exe",
                "application/x-msdownload",
                "malicious content".getBytes()
        );

        assertThatThrownBy(() -> fileStorageService.storeFile(file))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("File type not allowed");
    }

    @Test
    @DisplayName("Store empty file throws BadRequestException")
    void storeFile_Empty_ThrowsBadRequest() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.png",
                "image/png",
                new byte[0]
        );

        assertThatThrownBy(() -> fileStorageService.storeFile(file))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("empty file");
    }
}

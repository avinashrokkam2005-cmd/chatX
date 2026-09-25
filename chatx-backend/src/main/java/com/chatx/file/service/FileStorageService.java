package com.chatx.file.service;

import com.chatx.common.exception.BadRequestException;
import com.chatx.common.exception.ResourceNotFoundException;
import com.chatx.file.dto.FileUploadResponse;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private final Path fileStorageLocation;
    private final long maxFileSizeBytes;
    private final Set<String> allowedTypes;

    public FileStorageService(
            @Value("${chatx.file-storage.upload-dir:./uploads}") String uploadDir,
            @Value("${chatx.file-storage.max-file-size-mb:10}") long maxFileSizeMb,
            @Value("${chatx.file-storage.allowed-types:image/jpeg,image/png,image/gif,image/webp,video/mp4,audio/mpeg,audio/ogg,audio/webm,application/pdf,application/zip}") String allowedTypesStr
    ) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
        this.allowedTypes = Arrays.stream(allowedTypesStr.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("File storage directory initialized at: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            log.error("Could not create file storage directory: {}", ex.getMessage());
            throw new RuntimeException("Could not create the upload directory.", ex);
        }
    }

    public FileUploadResponse storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Cannot upload empty file");
        }

        if (file.getSize() > maxFileSizeBytes) {
            throw new BadRequestException("File size exceeds maximum limit of " + (maxFileSizeBytes / (1024 * 1024)) + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
            throw new BadRequestException("File type not allowed: " + contentType);
        }

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");

        // Protect against path traversal
        if (originalFileName.contains("..")) {
            throw new BadRequestException("Filename contains invalid path sequence: " + originalFileName);
        }

        // Sanitize name: keep only alphanumeric, underscores, hyphens, and extension
        String extension = "";
        int dotIndex = originalFileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFileName.substring(dotIndex);
            originalFileName = originalFileName.substring(0, dotIndex);
        }
        originalFileName = originalFileName.replaceAll("[^a-zA-Z0-9_-]", "_");

        String storedFileName = UUID.randomUUID() + "_" + originalFileName + extension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/files/" + storedFileName;
            log.info("File stored successfully: original='{}', stored='{}', size={}",
                    file.getOriginalFilename(), storedFileName, file.getSize());

            return new FileUploadResponse(storedFileName, fileUrl, contentType, file.getSize());
        } catch (IOException ex) {
            log.error("Failed to store file {}: {}", originalFileName, ex.getMessage());
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.fileStorageLocation.resolve(fileName).normalize();

            // Verify path hasn't escaped the upload dir
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new BadRequestException("Invalid file path request");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File", "name", fileName);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File", "name", fileName);
        }
    }
}

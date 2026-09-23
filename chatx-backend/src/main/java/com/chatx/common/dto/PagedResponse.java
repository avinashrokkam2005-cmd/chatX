package com.chatx.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class PagedResponse<T> {

    private boolean success;
    private List<T> data;
    private PaginationInfo pagination;
    private Instant timestamp;

    public PagedResponse() {
        this.timestamp = Instant.now();
    }

    public PagedResponse(boolean success, List<T> data, PaginationInfo pagination, Instant timestamp) {
        this.success = success;
        this.data = data;
        this.pagination = pagination;
        this.timestamp = timestamp != null ? timestamp : Instant.now();
    }

    public static class PaginationInfo {
        private String cursor;
        private boolean hasMore;
        private int size;
        private Long totalElements;

        public PaginationInfo() {}

        public PaginationInfo(String cursor, boolean hasMore, int size, Long totalElements) {
            this.cursor = cursor;
            this.hasMore = hasMore;
            this.size = size;
            this.totalElements = totalElements;
        }

        public static PaginationInfoBuilder builder() {
            return new PaginationInfoBuilder();
        }

        public static class PaginationInfoBuilder {
            private String cursor;
            private boolean hasMore;
            private int size;
            private Long totalElements;

            public PaginationInfoBuilder cursor(String cursor) {
                this.cursor = cursor;
                return this;
            }

            public PaginationInfoBuilder hasMore(boolean hasMore) {
                this.hasMore = hasMore;
                return this;
            }

            public PaginationInfoBuilder size(int size) {
                this.size = size;
                return this;
            }

            public PaginationInfoBuilder totalElements(Long totalElements) {
                this.totalElements = totalElements;
                return this;
            }

            public PaginationInfo build() {
                return new PaginationInfo(cursor, hasMore, size, totalElements);
            }
        }

        public String getCursor() { return cursor; }
        public void setCursor(String cursor) { this.cursor = cursor; }

        public boolean isHasMore() { return hasMore; }
        public void setHasMore(boolean hasMore) { this.hasMore = hasMore; }

        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }

        public Long getTotalElements() { return totalElements; }
        public void setTotalElements(Long totalElements) { this.totalElements = totalElements; }
    }

    public static <T> PagedResponseBuilder<T> builder() {
        return new PagedResponseBuilder<>();
    }

    public static class PagedResponseBuilder<T> {
        private boolean success;
        private List<T> data;
        private PaginationInfo pagination;
        private Instant timestamp = Instant.now();

        public PagedResponseBuilder<T> success(boolean success) {
            this.success = success;
            return this;
        }

        public PagedResponseBuilder<T> data(List<T> data) {
            this.data = data;
            return this;
        }

        public PagedResponseBuilder<T> pagination(PaginationInfo pagination) {
            this.pagination = pagination;
            return this;
        }

        public PagedResponseBuilder<T> timestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public PagedResponse<T> build() {
            return new PagedResponse<>(success, data, pagination, timestamp);
        }
    }

    public static <T> PagedResponse<T> of(List<T> data, String cursor, boolean hasMore, int size) {
        return PagedResponse.<T>builder()
                .success(true)
                .data(data)
                .pagination(PaginationInfo.builder()
                        .cursor(cursor)
                        .hasMore(hasMore)
                        .size(size)
                        .build())
                .timestamp(Instant.now())
                .build();
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public List<T> getData() { return data; }
    public void setData(List<T> data) { this.data = data; }

    public PaginationInfo getPagination() { return pagination; }
    public void setPagination(PaginationInfo pagination) { this.pagination = pagination; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}

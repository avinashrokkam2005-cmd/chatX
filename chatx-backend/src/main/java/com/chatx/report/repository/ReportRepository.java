package com.chatx.report.repository;

import com.chatx.report.entity.Report;
import com.chatx.report.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ReportRepository extends JpaRepository<Report, UUID> {

    @Query("SELECT r FROM Report r LEFT JOIN FETCH r.reporter LEFT JOIN FETCH r.resolvedBy WHERE (:status IS NULL OR r.status = :status) ORDER BY r.createdAt DESC")
    Page<Report> findByStatusOrderByCreatedAtDesc(@Param("status") ReportStatus status, Pageable pageable);

    long countByStatus(ReportStatus status);
}

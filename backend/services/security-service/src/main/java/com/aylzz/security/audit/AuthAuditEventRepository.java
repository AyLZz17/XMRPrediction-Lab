package com.aylzz.security.audit;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthAuditEventRepository extends JpaRepository<AuthAuditEvent, Long> {
    Optional<AuthAuditEvent> findFirstByEventTypeAndUserIdOrderByOccurredAtDesc(
            AuthAuditEventType eventType, UUID userId);
}

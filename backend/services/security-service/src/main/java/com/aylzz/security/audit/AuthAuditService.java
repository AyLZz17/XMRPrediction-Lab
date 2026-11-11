package com.aylzz.security.audit;

import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthAuditService {
    private final AuthAuditEventRepository events;

    public AuthAuditService(AuthAuditEventRepository events) {
        this.events = events;
    }

    @Transactional
    public void recordSuccess(AuthAuditEventType eventType, UUID userId) {
        events.save(new AuthAuditEvent(eventType, userId, MDC.get("request_id")));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(AuthAuditEventType eventType) {
        events.save(new AuthAuditEvent(eventType, null, MDC.get("request_id")));
    }
}

package com.aylzz.security.user;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    boolean existsByEmail(String email);

    Optional<AppUser> findByEmail(String email);
}

package com.caza.repository;
import com.caza.model.Lineup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface LineupRepository extends JpaRepository<Lineup,UUID> {
 List<Lineup> findByUserIdOrderByUpdatedAtDesc(Long userId);
 Optional<Lineup> findByIdAndUserId(UUID id, Long userId);
 long countByUserId(Long userId);
}

package com.caza.repository;

import com.caza.model.ForumThread;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ForumThreadRepository extends JpaRepository<ForumThread, Long> {

    Page<ForumThread> findByActivoTrueOrderByFechaCreacionDesc(Pageable pageable);
}

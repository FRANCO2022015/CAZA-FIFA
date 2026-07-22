package com.caza.repository;

import com.caza.model.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    List<Meeting> findByUserIdAndActivoTrueOrderByFechaInicioDesc(Long userId);

    List<Meeting> findAllByActivoTrueOrderByFechaInicioDesc();
}

package com.caza.repository;
import com.caza.model.PlayerChangeRequest;
import org.springframework.data.jpa.repository.*;
public interface PlayerChangeRequestRepository extends JpaRepository<PlayerChangeRequest, Long>, JpaSpecificationExecutor<PlayerChangeRequest> {}

package com.caza.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name="player_change_requests")
@Getter @Setter @NoArgsConstructor
public class PlayerChangeRequest {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private Long requesterId;
    @Column(nullable=false, length=200) private String requesterName;
    @Column(nullable=false, length=20) private String game;
    @Column(nullable=false) private Long playerId;
    private Long statsId;
    @Column(nullable=false, length=200) private String playerName;
    @Column(nullable=false, columnDefinition="text") private String beforeValues;
    @Column(nullable=false, columnDefinition="text") private String proposedValues;
    @Column(nullable=false, length=1000) private String reason;
    @Column(nullable=false, length=20) private String status="PENDIENTE";
    @Column(nullable=false) private Instant createdAt=Instant.now();
    private Long reviewerId;
    @Column(length=200) private String reviewerName;
    @Column(length=1000) private String reviewNote;
    private Instant reviewedAt;
}

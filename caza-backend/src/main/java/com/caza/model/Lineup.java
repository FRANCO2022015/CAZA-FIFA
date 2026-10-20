package com.caza.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="lineups") @Getter @Setter @NoArgsConstructor
public class Lineup {
 @Id private UUID id;
 @Column(nullable=false) private Long userId;
 @Column(nullable=false,length=100) private String name;
 @Column(nullable=false,columnDefinition="text") private String payload;
 @Version private Long version;
 @Column(nullable=false) private Instant updatedAt;
 @PrePersist @PreUpdate public void timestamp() { updatedAt=Instant.now(); }
}

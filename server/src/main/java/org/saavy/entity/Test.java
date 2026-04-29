package org.saavy.entity;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "test")
@Getter
@Setter
@NoArgsConstructor      // Required for JPA
@AllArgsConstructor     // Convenient for testing
public class Test {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "text_1")
    private String text1;

    @Column(name = "size")
    @JdbcTypeCode(SqlTypes.INTEGER)
    private Integer size;

}

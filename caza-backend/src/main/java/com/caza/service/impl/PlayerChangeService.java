package com.caza.service.impl;

import com.caza.model.*;
import com.caza.repository.PlayerChangeRequestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.persistence.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class PlayerChangeService {
    private final EntityManager em;
    private final ObjectMapper json;
    private final PlayerChangeRequestRepository requests;
    private static final Set<String> FIFA=Set.of("nombre","nacionalidad","posicion","edad","precio","imagenUrl","hologramUrl");
    private static final Set<String> EF=Set.of("nombre","precio","imagenUrl","hologramUrl","goles","asistencias","partidos");
    private static final Set<String> STATS=Set.of("goles","asistencias","partidosJugados");
    private record Target(Object player, Object stats, String name) {}
    private Target target(String game, Long id, Long statsId) {
        if(!Set.of("FIFA","EFOOTBALL").contains(game)) throw new IllegalArgumentException("Juego inválido");
        if(game.equals("EFOOTBALL")) {
            if(statsId!=null) throw new IllegalArgumentException("eFootball no utiliza temporadas FIFA");
            Jugador p=em.find(Jugador.class,id,LockModeType.PESSIMISTIC_WRITE);
            if(p==null || !Boolean.TRUE.equals(p.getActivo())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Jugador no disponible");
            return new Target(p,p,p.getNombre());
        }
        Player p=em.find(Player.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(p==null || !Boolean.TRUE.equals(p.getActivo())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Jugador no disponible");
        PlayerStats s=statsId==null?null:em.find(PlayerStats.class,statsId,LockModeType.PESSIMISTIC_WRITE);
        if(statsId!=null && (s==null || !s.getPlayer().getId().equals(id))) throw new IllegalArgumentException("La temporada no pertenece al jugador");
        return new Target(p,s,p.getNombre());
    }
    private Object holder(Target t, String game, String field) {
        return game.equals("FIFA") && STATS.contains(field) ? t.stats : t.player;
    }
    private String encoded(Object value) {
        try{return json.writeValueAsString(value);}catch(Exception e){throw new IllegalArgumentException("Datos inválidos");}
    }
    public Map<String,String> decoded(String value) {
        try{return json.readValue(value,new TypeReference<LinkedHashMap<String,String>>(){});}catch(Exception e){throw new IllegalStateException("Solicitud inválida");}
    }
    private String normalized(String field,String value,String game) {
        if(value==null) throw new IllegalArgumentException("Valor requerido: "+field);
        value=value.trim();
        if(STATS.contains(field)||field.equals("partidos")||field.equals("edad")) {
            try {
                int n=Integer.parseInt(value);
                if(n<0 || (field.equals("edad") && (n<16||n>45)) || (!field.equals("edad") && n>100000)) throw new NumberFormatException();
                return String.valueOf(n);
            } catch(NumberFormatException e){throw new IllegalArgumentException("Número inválido: "+field);}
        }
        if(field.equals("precio")) {
            try {BigDecimal n=new BigDecimal(value);if(n.signum()<0||n.compareTo(new BigDecimal("500"))>0||n.scale()>2)throw new NumberFormatException();return n.stripTrailingZeros().toPlainString();}
            catch(NumberFormatException e){throw new IllegalArgumentException("El precio debe estar entre 0 y 500, con hasta dos decimales");}
        }
        if(field.equals("posicion")){try{return Position.valueOf(value).name();}catch(Exception e){throw new IllegalArgumentException("Posición inválida");}}
        if(field.endsWith("Url")) {
            if(value.isEmpty())return "";
            try {var u=java.net.URI.create(value);if(!"https".equalsIgnoreCase(u.getScheme())||u.getHost()==null||u.getUserInfo()!=null||value.length()>500)throw new Exception();}
            catch(Exception e){throw new IllegalArgumentException("La imagen debe tener una URL HTTPS válida");}
            return value;
        }
        int max=field.equals("nacionalidad")?100:game.equals("FIFA")?150:200;
        if(value.isBlank()||value.length()>max)throw new IllegalArgumentException("Texto inválido: "+field);
        return value;
    }
    private String read(Object holder,String field) {
        Object v=new BeanWrapperImpl(holder).getPropertyValue(field);
        return v==null?"":v instanceof BigDecimal n?n.stripTrailingZeros().toPlainString():v.toString();
    }
    @Transactional
    public PlayerChangeRequest create(User user,String game,Long playerId,Long statsId,Map<String,String> proposed,String reason) {
        Target t=target(game,playerId,statsId);
        var before=new LinkedHashMap<String,String>();var after=new LinkedHashMap<String,String>();
        Set<String> allowed=new HashSet<>(game.equals("FIFA")?FIFA:EF);
        if(game.equals("FIFA")&&statsId!=null)allowed.addAll(STATS);
        for(var entry:proposed.entrySet()) {
            String f=entry.getKey();if(!allowed.contains(f))throw new IllegalArgumentException("Campo no permitido: "+f);
            String value=normalized(f,entry.getValue(),game),old=read(holder(t,game,f),f);
            if(!value.equals(old)){before.put(f,old);after.put(f,value);}
        }
        if(after.isEmpty())throw new IllegalArgumentException("La solicitud no contiene cambios");
        // Locking the player serializes submissions for this player, including duplicate checks.
        long count=requests.count((root,q,cb)->cb.and(cb.equal(root.get("requesterId"),user.getId()),cb.equal(root.get("status"),"PENDIENTE"),cb.equal(root.get("game"),game),cb.equal(root.get("playerId"),playerId)));
        if(count>0)throw new ResponseStatusException(HttpStatus.CONFLICT,"Ya tienes una solicitud pendiente para este jugador");
        var r=new PlayerChangeRequest();r.setRequesterId(user.getId());r.setRequesterName(user.getNombre());r.setGame(game);r.setPlayerId(playerId);r.setStatsId(statsId);r.setPlayerName(t.name);
        r.setBeforeValues(encoded(before));r.setProposedValues(encoded(after));r.setReason(reason.trim());return requests.save(r);
    }
    @Transactional
    public PlayerChangeRequest resolve(Long id,User reviewer,boolean approve,String note) {
        PlayerChangeRequest r=em.find(PlayerChangeRequest.class,id,LockModeType.PESSIMISTIC_WRITE);
        if(r==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Solicitud no encontrada");
        if(!r.getStatus().equals("PENDIENTE"))throw new ResponseStatusException(HttpStatus.CONFLICT,"La solicitud ya fue resuelta");
        if(approve) {
            Target t=target(r.getGame(),r.getPlayerId(),r.getStatsId());
            Map<String,String> before=decoded(r.getBeforeValues());
            for(var e:before.entrySet())if(!read(holder(t,r.getGame(),e.getKey()),e.getKey()).equals(e.getValue()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"El jugador cambió desde la solicitud. Recházala y pide una nueva propuesta actualizada.");
            for(var e:decoded(r.getProposedValues()).entrySet()) {
                String field=e.getKey(),value=normalized(field,e.getValue(),r.getGame());
                Object typed=value;
                if(STATS.contains(field)||field.equals("partidos")||field.equals("edad"))typed=Integer.valueOf(value);
                if(field.equals("precio"))typed=new BigDecimal(value);
                if(field.equals("posicion"))typed=Position.valueOf(value);
                if(field.endsWith("Url")&&value.isBlank())typed=null;
                new BeanWrapperImpl(holder(t,r.getGame(),field)).setPropertyValue(field,typed);
            }
        }
        r.setStatus(approve?"APROBADA":"RECHAZADA");r.setReviewerId(reviewer.getId());r.setReviewerName(reviewer.getNombre());r.setReviewNote(note==null?"":note.trim());r.setReviewedAt(Instant.now());
        em.flush();return r;
    }
    @Transactional(readOnly=true)
    public Page<PlayerChangeRequest> list(User user,String status,int page) {
        if(page<0)throw new IllegalArgumentException("Página inválida");
        if(status!=null&&!Set.of("PENDIENTE","APROBADA","RECHAZADA").contains(status))throw new IllegalArgumentException("Estado inválido");
        Specification<PlayerChangeRequest> spec=(root,q,cb)->{
            var parts=new ArrayList<jakarta.persistence.criteria.Predicate>();
            if(user.getRol()!=Role.ADMIN)parts.add(cb.equal(root.get("requesterId"),user.getId()));
            if(status!=null)parts.add(cb.equal(root.get("status"),status));return cb.and(parts.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        return requests.findAll(spec,PageRequest.of(page,20,Sort.by("id").descending()));
    }
    @Transactional(readOnly=true)
    public long pending(User user) {
        return requests.count((root,q,cb)->user.getRol()==Role.ADMIN?cb.equal(root.get("status"),"PENDIENTE"):cb.and(cb.equal(root.get("status"),"PENDIENTE"),cb.equal(root.get("requesterId"),user.getId())));
    }
}

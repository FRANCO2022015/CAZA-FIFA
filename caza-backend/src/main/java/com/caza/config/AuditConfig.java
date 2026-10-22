package com.caza.config;
import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.security.core.context.SecurityContextHolder;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.*;
import org.hibernate.persister.entity.EntityPersister;
import com.caza.model.*;
import java.util.*;

@Component @RequiredArgsConstructor
public class AuditConfig implements PostInsertEventListener, PostUpdateEventListener, PostDeleteEventListener {
 private final EntityManagerFactory emf;
 private static final Set<String> ENTITIES=Set.of("Player","Jugador","PlayerStats","Purchase","User","SaldoRequest","ForumThread","ForumPost","Comment","Meeting","Lineup","PlayerChangeRequest");
 // Explicit allowlist: credentials and tokens can never enter this log.
 private static final Set<String> FIELDS=Set.of("nombre","nacionalidad","posicion","edad","precio","imagenUrl","hologramUrl","activo","goles","asistencias","partidos","partidosJugados","temporada","saldo","rol","precioTotal","itemsSnapshot","estado","monto","montoSolicitado","mensaje","fechaRespuesta","titulo","descripcion","contenido","rating","url","fechaInicio","fechaFin","tema","name","payload","requesterName","requesterId","reviewerName","reviewerId","reason","status","beforeValues","proposedValues","reviewNote");
 @PostConstruct public void register() {
   var r=emf.unwrap(SessionFactoryImplementor.class).getServiceRegistry().getService(EventListenerRegistry.class);
   r.appendListeners(EventType.POST_INSERT,this); r.appendListeners(EventType.POST_UPDATE,this); r.appendListeners(EventType.POST_DELETE,this);
 }
 @Override public boolean requiresPostCommitHandling(EntityPersister p) { return false; }
 @Override public void onPostInsert(PostInsertEvent e) { write(e.getEntity(),e.getId(),e.getPersister(),null,e.getState(),"CREAR",e.getSession()); }
 @Override public void onPostUpdate(PostUpdateEvent e) { write(e.getEntity(),e.getId(),e.getPersister(),e.getOldState(),e.getState(),"ACTUALIZAR",e.getSession()); }
 @Override public void onPostDelete(PostDeleteEvent e) { write(e.getEntity(),e.getId(),e.getPersister(),e.getDeletedState(),null,"ELIMINAR",e.getSession()); }
 private String text(Object value) {
   return value == null ? null : String.valueOf(value);
 }
 private void write(Object entity,Object id,EntityPersister persister,Object[] old,Object[] now,String action,EventSource session) {
   String type=persister.getMappedClass().getSimpleName();
   if(!ENTITIES.contains(type)) return;
   var auth=SecurityContextHolder.getContext().getAuthentication();
   User actor=auth!=null && auth.getPrincipal() instanceof User u ? u : null;
   String label=type+" #"+id;
   String game=type.equals("Player") || type.equals("PlayerStats") ? "FIFA" : type.equals("Jugador") ? "EFOOTBALL" : null;
   if(entity instanceof User u) label=u.getNombre()+" #"+u.getId();
   if(entity instanceof SaldoRequest r) label="Saldo de "+r.getUser().getNombre()+" #"+r.getUser().getId();
   if(entity instanceof Player p) label=p.getNombre();
   if(entity instanceof Jugador p) label=p.getNombre();
   if(entity instanceof PlayerStats s) label=s.getPlayer().getNombre()+" #"+s.getPlayer().getId()+" / "+s.getTemporada();
   if(entity instanceof Lineup l) label=l.getName();
   if(entity instanceof PlayerChangeRequest r) { label="Solicitud #"+r.getId()+" / "+r.getPlayerName()+" / solicitante "+r.getRequesterName()+" #"+r.getRequesterId(); game=r.getGame(); }
   final String display=label;
   final String auditGame=game;
   String[] names=persister.getPropertyNames();
   for(int i=0;i<names.length;i++) {
     String field=names[i];
     if(!FIELDS.contains(field)) continue;
     if(old!=null && now!=null && old[i] instanceof java.math.BigDecimal a && now[i] instanceof java.math.BigDecimal b && a.compareTo(b)==0) continue;
     String before=old==null?null:text(old[i]), after=now==null?null:text(now[i]);
     if(Objects.equals(before,after)) continue;
     String operation=field.equals("activo") && "false".equals(after) ? "ARCHIVAR" :
         field.equals("activo") && "false".equals(before) && "true".equals(after) ? "RESTAURAR" : action;
     session.doWork(connection -> {
       try(var stmt=connection.prepareStatement("INSERT INTO audit_events(actor_id,actor_name,entity_type,entity_id,entity_name,game,action,field_name,old_value,new_value) VALUES (?,?,?,?,?,?,?,?,?,?)")) {
         stmt.setObject(1,actor==null?null:actor.getId()); stmt.setString(2,actor==null?"Sistema":actor.getNombre());
         stmt.setString(3,type); stmt.setString(4,String.valueOf(id)); stmt.setString(5,display);
         stmt.setString(6,auditGame); stmt.setString(7,operation); stmt.setString(8,field);
         stmt.setString(9,before); stmt.setString(10,after); stmt.executeUpdate();
       }
     });
   }
 }
}

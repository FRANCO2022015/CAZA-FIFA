import api from './axiosConfig';
export type ChangeRequest = {
 id:number; requesterId:number; requesterName:string; game:'FIFA'|'EFOOTBALL'; playerId:number; statsId:number|null; playerName:string;
 beforeValues:string; proposedValues:string; reason:string; status:'PENDIENTE'|'APROBADA'|'RECHAZADA'; createdAt:string;
 reviewerName:string|null; reviewNote:string|null; reviewedAt:string|null;
};
export const changeLabels:Record<string,string>={nombre:'Nombre',nacionalidad:'Nacionalidad',posicion:'Posición',edad:'Edad',precio:'Precio',imagenUrl:'Foto original',hologramUrl:'Recorte holográfico',goles:'Goles',asistencias:'Asistencias',partidos:'Partidos',partidosJugados:'Partidos de la temporada'};
export const playerChangesApi={
 create:async(body:{game:string;playerId:number;statsId?:number;changes:Record<string,string>;reason:string})=>(await api.post('/player-change-requests',body)).data.data as ChangeRequest,
 list:async(status:string,page:number)=>(await api.get('/player-change-requests',{params:{status:status||undefined,page}})).data.data as {content:ChangeRequest[];totalPages:number;totalElements:number},
 resolve:async(id:number,approve:boolean,note:string)=>(await api.post(`/player-change-requests/${id}/resolve`,{approve,note})).data.data as ChangeRequest,
 pending:async()=>(await api.get('/player-change-requests/pending-count')).data.data as number,
};

export type Metric='goles'|'asistencias'|'partidos';
export type Snapshot={id:number;playerId:number;nombre:string;at:string;goles:number;asistencias:number;partidos:number};
export type TimelinePoint={time:number;a:number|null;b:number|null};
export function buildTimeline(rows:Snapshot[],first:number,second:number,metric:Metric):TimelinePoint[]{
 const result:TimelinePoint[]=[];let a:number|null=null,b:number|null=null;
 for(const row of [...rows].sort((x,y)=>Date.parse(x.at)-Date.parse(y.at)||x.id-y.id)){
  if(row.playerId!==first&&row.playerId!==second)continue;
  if(row.playerId===first)a=row[metric];else b=row[metric];
  const point={time:Date.parse(row.at),a,b};
  if(result.length&&result[result.length-1].time===point.time)result[result.length-1]=point;else result.push(point);
 }return result;
}
export function firstOvertake(points:TimelinePoint[]):{time:number;elapsed:number}|null{
 let start:number|null=null,wasBehind=false;
 for(const p of points){if(p.a===null||p.b===null)continue;if(start===null)start=p.time;
  if(wasBehind&&p.b>p.a)return{time:p.time,elapsed:p.time-start};
  wasBehind=p.b<=p.a;
 }return null;
}

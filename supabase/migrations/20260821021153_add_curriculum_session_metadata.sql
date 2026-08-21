alter table public.classes
  add column curriculum_code text,
  add column curriculum_order integer,
  add constraint classes_curriculum_code_format
    check (curriculum_code is null or curriculum_code ~ '^C[0-9]{2}$'),
  add constraint classes_curriculum_order_range
    check (curriculum_order is null or curriculum_order between 1 and 58);

create unique index classes_curriculum_code_idx
  on public.classes (curriculum_code) where curriculum_code is not null;
create unique index classes_curriculum_order_idx
  on public.classes (curriculum_order) where curriculum_order is not null;

create table public.class_audio_sources (
  class_id bigint not null references public.classes (id) on delete cascade,
  audio_number integer not null,
  fragment text not null default '',
  position integer not null default 1,
  primary key (class_id, audio_number, position),
  constraint class_audio_sources_number_range check (audio_number between 1 and 70),
  constraint class_audio_sources_position_positive check (position > 0),
  constraint class_audio_sources_fragment_length check (char_length(fragment) <= 120)
);

create index class_audio_sources_audio_number_idx
  on public.class_audio_sources (audio_number, position);

alter table public.class_audio_sources enable row level security;
grant select on public.class_audio_sources to authenticated;
grant select, insert, update, delete on public.class_audio_sources to service_role;

create policy class_audio_sources_select_published_or_admin
on public.class_audio_sources for select to authenticated
using (
  exists (
    select 1 from public.classes
    where classes.id = class_audio_sources.class_id
      and (
        classes.publication_status = 'published'
        or (select private.is_admin())
      )
  )
);

update public.classes as c
set curriculum_order = (c.id - 9)::integer,
    curriculum_code = 'C' || lpad((c.id - 9)::text, 2, '0')
where c.id between 10 and 49;

with historical_audio_sources (class_id, audio_number, fragment, position) as (
values
  (10,1,'completo',1),(10,2,'completo',2),(11,4,'completo',1),(11,5,'primera parte',2),
  (12,5,'cierre',1),(12,14,'completo',2),(12,15,'completo',3),(13,18,'completo',1),
  (14,56,'segunda parte',1),(14,57,'completo',2),(15,5,'fundamento inicial',1),(15,6,'completo',2),
  (16,7,'completo',1),(17,10,'completo',1),(18,22,'fragmento legislativo',1),
  (19,11,'completo',1),(19,12,'primera parte',2),(20,12,'segunda parte',1),
  (21,13,'completo',1),(22,16,'completo',1),(23,19,'completo',1),(23,22,'cierre administrativo',2),
  (24,20,'completo',1),(24,22,'cierre administrativo',2),(25,22,'fragmento CNDH',1),(25,23,'completo',2),
  (26,26,'completo',1),(27,27,'completo',1),(28,67,'primera parte',1),
  (29,28,'completo',1),(29,29,'primera parte',2),(30,29,'segunda parte',1),
  (31,30,'completo',1),(32,31,'completo',1),(33,34,'completo',1),(34,35,'primera parte',1),
  (35,35,'cierre',1),(35,36,'completo',2),(36,37,'primera parte',1),
  (37,37,'cierre',1),(37,38,'completo',2),(38,3,'panorama',1),(38,40,'primera parte',2),
  (39,40,'segunda parte',1),(40,41,'completo',1),(41,43,'completo',1),(41,3,'panorama',2),
  (42,45,'completo',1),(43,46,'primera parte',1),(44,47,'completo',1),
  (45,50,'primera parte',1),(46,50,'segunda parte',1),(47,51,'primera parte',1),
  (48,51,'segunda parte',1),(49,53,'completo',1)
)
insert into public.class_audio_sources (class_id, audio_number, fragment, position)
select sources.class_id, sources.audio_number, sources.fragment, sources.position
from historical_audio_sources as sources
join public.classes as classes on classes.id = sources.class_id;

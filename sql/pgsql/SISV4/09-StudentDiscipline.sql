------------------------
---DisciplineIncident---
select di.incidentdate
	 , di.incidentidentifier
	 , di.schoolid
	 , db.codevalue as behaviordescriptor
	 , dil.codevalue as incidentlocationdescriptor
	 , drd.codevalue as reporterdescriptiondescriptor
	 , di.reportername
	 , s.staffuniqueid
from edfi.disciplineincident di
left join edfi.disciplineincidentbehavior dib on dib.incidentidentifier = di.incidentidentifier
    and dib.schoolid = di.schoolid
left join edfi.behaviordescriptor bd on bd.behaviordescriptorid = dib.behaviordescriptorid
left join edfi.descriptor db on db.descriptorid = bd.behaviordescriptorid
left join edfi.incidentlocationdescriptor ild on ild.incidentlocationdescriptorid = di.incidentlocationdescriptorid
left join edfi.descriptor dil on dil.descriptorid = ild.incidentlocationdescriptorid
left join edfi.reporterdescriptiondescriptor rdd on rdd.reporterdescriptiondescriptorid = di.reporterdescriptiondescriptorid
left join edfi.descriptor drd on drd.descriptorid = rdd.reporterdescriptiondescriptorid
left join edfi.staff s on s.staffusi = di.staffusi
where di.schoolid in (255901107,255901001);

------------------------------------------
---StudentDisciplineIncidentAssociation---
select sdia.incidentidentifier
	 , sdia.schoolid
	 , dspc.codevalue as studentparticipationcodedescriptor
	 , s.studentuniqueid
from edfi.studentdisciplineincidentassociation sdia
join edfi.studentparticipationcodedescriptor spcd on spcd.studentparticipationcodedescriptorid = sdia.studentparticipationcodedescriptorid
join edfi.descriptor dspc on dspc.descriptorid = spcd.studentparticipationcodedescriptorid
join edfi.student s on s.studentusi = sdia.studentusi
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));

----------------------
---DisciplineAction---
select da.disciplineactionidentifier
	 , d.codevalue as disciplinedescriptor
	 , da.disciplinedate
	 , s.studentuniqueid
	 , da.actualdisciplineactionlength
	 , da.receivededucationservicesduringexpulsion
	 , dadi.incidentidentifier
	 , dadi.schoolid
	 , sdi.studentuniqueid as disciplineincidentstudentuniqueid
	 , da.responsibilityschoolid
	 , da.iepplacementmeetingindicator
from edfi.disciplineaction da
join edfi.disciplineactiondiscipline dad on dad.disciplineactionidentifier = da.disciplineactionidentifier
	and dad.studentusi = da.studentusi
    and dad.disciplinedate = da.disciplinedate
join edfi.disciplinedescriptor dd on dd.disciplinedescriptorid = dad.disciplinedescriptorid
join edfi.descriptor d on d.descriptorid = dd.disciplinedescriptorid
join edfi.student s on s.studentusi = da.studentusi
join edfi.disciplineactionstudentdisciplineincidentassociation dadi on dadi.studentusi = da.studentusi
    and dadi.disciplineactionidentifier = da.disciplineactionidentifier
    and dadi.disciplinedate = da.disciplinedate
join edfi.studentdisciplineincidentassociation sdia on sdia.studentusi = da.studentusi
	and sdia.incidentidentifier = dadi.incidentidentifier
join edfi.student sdi on sdi.studentusi = dadi.studentusi
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));
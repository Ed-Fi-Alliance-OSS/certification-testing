--------------------
---CourseOffering---
select c.coursecode
     , c.educationorganizationid
     , co.schoolid
	 , s.sessionname 
	 , s.schoolid as sessionschoolid
     , syt.schoolyeardescription as sessionschoolyear
     --, DT.CodeValue AS [TermDescriptor]
     , co.localcoursetitle
     , co.localcoursecode
from edfi.courseoffering co
join edfi.course c on co.coursecode = c.coursecode
    and co.educationorganizationid = c.educationorganizationid
join edfi.session s on s.schoolid = co.schoolid
    and s.schoolyear = co.schoolyear
    and s.sessionname = co.sessionname
join edfi.schoolyeartype syt on syt.schoolyear = s.schoolyear
join edfi.termdescriptor  td on s.termdescriptorid = td.termdescriptorid
join edfi.descriptor dt on dt.descriptorid = td.termdescriptorid
where co.schoolid in (255901107,255901001)
	and dt.codevalue = 'fall semester';


-------------
---Section---
select scp.classperiodname
	 , scp.schoolid as classperiodschoolid
	 , s.sessionname
	 , co.localcoursecode
	 , syt.schoolyeardescription as courseofferingschoolid
	 , s.schoolyear
	 , l.classroomidentificationcode
	 , l.schoolid as locationschoolid
	 , s.schoolid
	 , s.sequenceofcourse
	 , s.sectionidentifier
	 , s.availablecredits
	 , dee.codevalue as educationalevnironmentdescriptor
from edfi.section s
join edfi.sectionclassperiod scp on scp.schoolid = s.schoolid
		and scp.localcoursecode = s.localcoursecode
		and scp.sectionidentifier = s.sectionidentifier
		and scp.sessionname = s.sessionname
		and scp.schoolyear = s.schoolyear
join edfi.courseoffering co on co.localcoursecode = s.localcoursecode
	and co.schoolid = s.schoolid
	and co.schoolyear = s.schoolyear
	and co.sessionname = s.sessionname
join edfi.schoolyeartype syt on syt.schoolyear = co.schoolyear
join edfi.location l on l.classroomidentificationcode = s.locationclassroomidentificationcode
	and l.schoolid = s.schoolid
join edfi.descriptor dee on s.educationalenvironmentdescriptorid = dee.descriptorid 
		join edfi.educationalenvironmentdescriptor eed on dee.descriptorid = eed.educationalenvironmentdescriptorid 
where s.schoolid in (255901107,255901001)
and s.sessionname like ('%fall semester');

-------------------
---Bell Schedule---
select bs.bellschedulename
     , bs.schoolid
	 , bscp.classperiodname
	 , bs.alternatedayname
from edfi.bellschedule bs
join edfi.bellscheduleclassperiod bscp on bscp.bellschedulename = bs.bellschedulename
     and bscp.schoolid = bs.schoolid
where bs.schoolid = 255901107;
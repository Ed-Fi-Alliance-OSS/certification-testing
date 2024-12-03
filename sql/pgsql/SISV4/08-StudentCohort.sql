------------
---Cohort---
select c.educationorganizationid
	 , c.cohortidentifier
	 , dct.codevalue as cohorttype
	 , c.cohortdescription
	 , dcs.codevalue as cohortscopetype
from edfi.cohort c
join edfi.cohorttypedescriptor ctd on ctd.cohorttypedescriptorid = c.cohorttypedescriptorid
join edfi.descriptor dct on dct.descriptorid = ctd.cohorttypedescriptorid
left join edfi.cohortscopedescriptor cst on cst.cohortscopedescriptorid = c.cohortscopedescriptorid
left join edfi.descriptor dcs on dcs.descriptorid = cst.cohortscopedescriptorid;

----------------------------
---StaffCohortAssociation---
select sca.educationorganizationid
	 , sca.cohortidentifier
	 , sca.begindate
	 , sca.enddate
	 , s.staffuniqueid
from edfi.staffcohortassociation sca
join edfi.staff s on s.staffusi = sca.staffusi
where ((s.firstname = 'john' and s.lastsurname = 'loyo') or (s.firstname = 'jane' and s.lastsurname = 'smith'));

------------------------------
---StudentCohortAssociation---
select sca.educationorganizationid
	 , sca.cohortidentifier
	 , s.studentuniqueid
	 , sca.begindate
	 , sca.enddate
from edfi.studentcohortassociation sca
join edfi.student s on s.studentusi = sca.studentusi
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));
-------------
---Student---
select s.studentuniqueid
     , s.birthcity
	 , dc.codevalue as birthcountrydescriptor
	 , s.birthdate
	 , s.firstname
	 , s.middlename
	 , s.lastsurname
	 , s.generationcodesuffix
from edfi.student s
left join edfi.countrydescriptor cd on cd.countrydescriptorid = s.birthcountrydescriptorid
left join edfi.descriptor dc on dc.descriptorid = cd.countrydescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));
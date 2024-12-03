----------------------------------
---StudentSchoolAttendanceEvent---
select ssae.schoolid
     , se.schoolid as sessionschoolid
	 , syt.schoolyeardescription
	 , se.sessionname
	 , s.studentuniqueid
	 , daec.codevalue as attendanceeventcategorydescriptor
	 , ssae.eventdate
from edfi.studentschoolattendanceevent ssae
join edfi.session se on se.schoolid = ssae.schoolid
	and se.schoolyear = ssae.schoolyear
	and se.sessionname = ssae.sessionname
join edfi.schoolyeartype syt on syt.schoolyear = se.schoolyear
join edfi.student s on s.studentusi = ssae.studentusi
join edfi.attendanceeventcategorydescriptor aecd on aecd.attendanceeventcategorydescriptorid = ssae.attendanceeventcategorydescriptorid
join edfi.descriptor daec on daec.descriptorid = aecd.attendanceeventcategorydescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));


-----------------------------------
---StudentSectionAttendanceEvent---
select ssae.localcoursecode
	 , ssae.schoolid
	 , syt.schoolyeardescription
	 , ssae.sectionidentifier
	 , ssae.sessionname
	 , s.studentuniqueid
	 , daec.codevalue as attendanceeventcategorydescriptor
	 , ssae.eventdate
from edfi.studentsectionattendanceevent ssae
join edfi.schoolyeartype syt on syt.schoolyear = ssae.schoolyear
join edfi.student s on s.studentusi = ssae.studentusi
join edfi.attendanceeventcategorydescriptor aecd on aecd.attendanceeventcategorydescriptorid = ssae.attendanceeventcategorydescriptorid
join edfi.descriptor daec on daec.descriptorid = aecd.attendanceeventcategorydescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));
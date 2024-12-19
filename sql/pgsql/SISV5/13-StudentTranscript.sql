----------------------
---CourseTranscript---
select ct.courseeducationorganizationid
	 , ct.coursecode
	 , sar.educationorganizationid as studentacademicrecordeducationorganizationid
	 , syt.schoolyeardescription
	 , s.studentuniqueid
	 , dt.codevalue as termdescriptor
	 , dcar.codevalue as courseattemptresultdescriptor
	 , ct.attemptedcredits
	 , ct.earnedcredits
	 , ct.finallettergradeearned
from edfi.coursetranscript ct
join edfi.studentacademicrecord sar on sar.studentusi = ct.studentusi
	and sar.educationorganizationid = ct.educationorganizationid
	and sar.schoolyear = ct.schoolyear
	and sar.termdescriptorid = ct.termdescriptorid
join edfi.schoolyeartype syt on syt.schoolyear = sar.schoolyear
join edfi.student s on s.studentusi = sar.studentusi
join edfi.termdescriptor td on td.termdescriptorid = sar.termdescriptorid
join edfi.descriptor dt on dt.descriptorid = td.termdescriptorid
join edfi.courseattemptresultdescriptor card on card.courseattemptresultdescriptorid = ct.courseattemptresultdescriptorid
join edfi.descriptor dcar on dcar.descriptorid = card.courseattemptresultdescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));

---------------------------
---StudentAcademicRecord---
select sar.educationorganizationid
	 , syt.schoolyeardescription
	 , s.studentuniqueid
	 , dt.codevalue as termdescriptor
	 , sar.cumulativeattemptedcredits
	 , sar.sessionattemptedcredits
	 , sar.cumulativeearnedcredits
	 , sar.sessionattemptedcredits
	 , sar.sessionearnedcredits
from edfi.studentacademicrecord sar
join edfi.schoolyeartype syt on syt.schoolyear = sar.schoolyear
join edfi.student s on s.studentusi = sar.studentusi
join edfi.termdescriptor td on td.termdescriptorid = sar.termdescriptorid
join edfi.descriptor dt on dt.descriptorid = td.termdescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));
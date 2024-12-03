-----------------------------
-- STUDENT ASSESSMENT ITEM --
-----------------------------

select
	sai.studentusi
	, s.studentuniqueid
	, sai.identificationcode
	, sai.assessmentresponse
	, dair.shortdescription as assessmentitemresulttype
	, sai.rawscoreresult
	, sai.namespace
	, sai.studentassessmentidentifier
	, sai.assessmentidentifier
	, sai.descriptivefeedback
	, dri.shortdescription as responseindicatortype
	, sai.timeassessed
from edfi.studentassessmentitem sai
left join edfi.descriptor dri on dri.descriptorid = sai.responseindicatordescriptorid
join edfi.descriptor dair on dair.descriptorid = sai.assessmentitemresultdescriptorid
join edfi.student s on s.studentusi = sai.studentusi
where sai.namespace like '%%'
	--AND s.StudentUniqueId IN ('604917', '604863')
	--AND IdentificationCode LIKE '%Q:10'
	--AND s.StudentUniqueId = '604850'

--DELETE FROM edfi.StudentAssessmentItem WHERE StudentUSI = 31
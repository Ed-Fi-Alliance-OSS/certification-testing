----------------------------------
-- STUDENT OBJECTIVE ASSESSMENT --
----------------------------------

select
	saso.studentusi
	, s.studentuniqueid
	, saso.identificationcode
	, sasos.result
	, drdt.description as resultdatatype
	, darm.description as assessmentreportingmethod
	, sasop.performanceleveldescriptorid
	, dpl.description as performancelevel
	, darm2.description as assessmentreportingmethod
	, saso.studentassessmentidentifier
	, saso.assessmentidentifier
	, saso.namespace
from edfi.studentassessmentstudentobjectiveassessment saso
-- score result --
left join edfi.studentassessmentstudentobjectiveassessmentscoreresult sasos on sasos.studentusi = saso.studentusi
	and sasos.studentassessmentidentifier = saso.studentassessmentidentifier
	and sasos.assessmentidentifier = saso.assessmentidentifier
	and sasos.namespace = saso.namespace
	and sasos.identificationcode = saso.identificationcode
left join edfi.descriptor drdt on drdt.descriptorid = sasos.resultdatatypetypedescriptorid
left join edfi.descriptor darm on darm.descriptorid = sasos.assessmentreportingmethoddescriptorid
-- performance level --
left join edfi.studentassessmentstudentobjectiveassessmentperformancelevel sasop on sasop.studentusi = saso.studentusi
	and sasop.studentassessmentidentifier = saso.studentassessmentidentifier
	and sasop.assessmentidentifier = saso.assessmentidentifier
	and sasop.namespace = saso.namespace
	and sasop.identificationcode = saso.identificationcode
left join edfi.performanceleveldescriptor pld on pld.performanceleveldescriptorid = sasop.performanceleveldescriptorid
left join edfi.descriptor dpl on dpl.descriptorid = pld.performanceleveldescriptorid
left join edfi.descriptor darm2 on darm2.descriptorid = sasop.assessmentreportingmethoddescriptorid
join edfi.student s on s.studentusi = saso.studentusi
where saso.namespace like '%%'
	--AND s.StudentUniqueId IN ()

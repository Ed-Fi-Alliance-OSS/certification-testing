-----------------------------------
-- OBJECTIVE ASSESSMENT METADATA --
-----------------------------------

select
	oa.identificationcode
	, dpl.description as performancelevel
	, darm.description as assessmentreportingmethod
	, oapl.minimumscore
	, oapl.maximumscore
	, drdt.description as resultdatatypetype
	, oa.maxrawscore
	, ls.description as learningstandard
	, oa.namespace
	, oa.percentofassessment
	, oa.nomenclature
	, oa.description
	, oaai.assessmentitemidentificationcode
	, oa.parentidentificationcode
	, oa.assessmentidentifier
	, darm2.description as assessmentreportingmethodtype
	, oas.minimumscore
	, oas.maximumscore
	, drdt2.description as resultdatatypetype
from edfi.objectiveassessment oa
-- assessment performance level --
left join edfi.objectiveassessmentperformancelevel oapl
	on oapl.assessmentidentifier = oa.assessmentidentifier
	and oapl.namespace = oa.namespace
left join edfi.performanceleveldescriptor pld
	on pld.performanceleveldescriptorid = oapl.performanceleveldescriptorid
left join edfi.descriptor dpl
	on dpl.descriptorid = pld.performanceleveldescriptorid
left join edfi.descriptor darm
	on darm.descriptorid = oapl.assessmentreportingmethoddescriptorid
left join edfi.descriptor drdt
	on drdt.descriptorid = oapl.resultdatatypetypedescriptorid
-- assessment item reference --
left join edfi.objectiveassessmentassessmentitem oaai
	on oaai.assessmentitemidentificationcode = oa.identificationcode
	and oaai.assessmentidentifier = oa.assessmentidentifier
	and oaai.namespace = oa.namespace
left join edfi.gradebookentrylearningstandard gls
	on gls.learningstandardid = oa.identificationcode
	and gls.gradebookentryidentifier = oa.assessmentidentifier
	and gls.namespace = oa.namespace
-- learning standard reference --
left join edfi.objectiveassessmentlearningstandard oals
	on oals.identificationcode = oa.identificationcode
	and oals.namespace = oa.namespace
	and oals.assessmentidentifier = oa.assessmentidentifier
left join edfi.learningstandard ls
	on ls.learningstandardid = oals.learningstandardid
-- assessment score --
left join edfi.objectiveassessmentscore oas
	on oas.identificationcode = oa.identificationcode
	and oas.assessmentidentifier = oa.assessmentidentifier
	and oas.namespace = oa.namespace
left join edfi.descriptor darm2
	on darm2.descriptorid = oas.assessmentreportingmethoddescriptorid
left join edfi.descriptor drdt2
	on drdt2.descriptorid = oas.resultdatatypetypedescriptorid
where oa.namespace like '%%';

------------------------------------------------------
---- OBJECTIVE ASSESSMENT IDENTIFICATION CODE COUNT --
------------------------------------------------------

--SELECT COUNT(DISTINCT IdentificationCode) AS DistinctIdentificationCodeCount
--FROM edfi.ObjectiveAssessment
--WHERE Namespace Like '%%'

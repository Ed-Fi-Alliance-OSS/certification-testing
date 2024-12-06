------------------------
-- STUDENT ASSESSMENT --
------------------------

select
	sa.studentusi
	, s.studentuniqueid
	, sa.administrationdate
	, sasr.result
	, drdt.description as resultdatatype
	, darm.description as assessmentreportingmethod
	, sapl.performanceleveldescriptorid
	, dpl.description as performancelevel
	, darm2.description as assessmentreportingmethod
	, sa.studentassessmentidentifier
	, sa.assessmentidentifier
	, sa.namespace
	, dgl.description as whenassessedgradelevel
	, sa.administrationenddate
	, sa.serialnumber
	, dal.description as administrationlanguage
	, dae.description as administrationenvironment
	, dsaa.description as accommodation
	, dri.description as retestindicator
	, drnt.description as reasonnottested
	, dect.description as eventcircumstance
	, sa.eventdescription
	, sa.createdate
from edfi.studentassessment sa
-- administration language --
left join edfi.descriptor dal
	on dal.descriptorid = sa.administrationlanguagedescriptorid
-- administration environment --
left join edfi.descriptor dae
	on dae.descriptorid = sa.administrationenvironmentdescriptorid
-- accommodation --
left join edfi.studentassessmentaccommodation saa
	on saa.studentassessmentidentifier = sa.studentassessmentidentifier
	and saa.assessmentidentifier = sa.assessmentidentifier
	and saa.namespace = sa.namespace
	and saa.studentusi = sa.studentusi
left join edfi.descriptor dsaa
	on dsaa.descriptorid = saa.accommodationdescriptorid
-- retest indicator type --
left join edfi.descriptor dri
	on dri.descriptorid = sa.retestindicatordescriptorid
-- reason not tested type --
left join edfi.descriptor drnt
	on drnt.descriptorid = sa.reasonnottesteddescriptorid
-- score result --
left join edfi.studentassessmentscoreresult sasr
	on sasr.studentassessmentidentifier = sa.studentassessmentidentifier
	and sasr.assessmentidentifier = sa.assessmentidentifier
	and sasr.namespace = sa.namespace
	and sasr.studentusi = sa.studentusi
left join edfi.descriptor drdt
	on drdt.descriptorid = sasr.resultdatatypetypedescriptorid
left join edfi.descriptor darm
	on darm.descriptorid = sasr.assessmentreportingmethoddescriptorid
-- when assessed grade level --
left join edfi.gradeleveldescriptor gld
	on gld.gradeleveldescriptorid = sa.whenassessedgradeleveldescriptorid
left join edfi.descriptor dgl
	on dgl.descriptorid = gld.gradeleveldescriptorid
-- performance level --
left join edfi.studentassessmentperformancelevel sapl
	on sapl.studentassessmentidentifier = sa.studentassessmentidentifier
	and sapl.assessmentidentifier = sa.assessmentidentifier
	and sapl.namespace = sa.namespace
	and sapl.studentusi = sa.studentusi
left join edfi.descriptor dpl
	on dpl.descriptorid = sapl.performanceleveldescriptorid
left join edfi.descriptor darm2
	on darm2.descriptorid = sapl.assessmentreportingmethoddescriptorid
-- event circumstance --
left join edfi.descriptor dect
	on dect.descriptorid = sa.eventcircumstancedescriptorid
left join edfi.student s
	on s.studentusi = sa.studentusi
where sa.namespace like '%%'
	--AND s.StudentUniqueId IN ()

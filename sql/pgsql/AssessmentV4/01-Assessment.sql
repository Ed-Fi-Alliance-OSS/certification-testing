-------------------------
-- ASSESSMENT METADATA --
-------------------------

select
	a.assessmenttitle
	, darm.description as assessmentreportingmethod
	, ascore.minimumscore
	, ascore.maximumscore
	, drdt.description as resultdatatypetype
	, dpl.description as performancelevel
	, darm2.description as assessmentreportingmethod
	, apl.minimumscore
	, apl.maximumscore
	, drdt2.description as resultdatatypetype
	, das.description as academicsubject
	, a.assessmentidentifier
	, a.namespace
	, aid.identificationcode
	, dai.description as identificationcodesystem
	, aid.assigningorganizationidentificationcode
	, dac.description as assessmentcategory
	, dagl.description as assessedgradelevel
	, acs.title
	, acsa.author
	, acs.version
	, acs.uri
	, acs.publicationdate
	, acs.publicationyear
	, dps.description as publicationstatustype
	, meo.nameofinstitution as mandatingeducationorganization
	, acs.begindate
	, acs.enddate
	, a.assessmentform
	, dal.description as language
	, a.revisiondate
	, a.maxrawscore
	, a.nomenclature
	, dap.description as assessmentperiod
	, ap.begindate
	, ap.enddate
	, eo.nameofinstitution as educationorganization
	, a.adaptiveassessment
from edfi.assessment a
-- assessment identification code --
left join edfi.assessmentidentificationcode aid
	on aid.assessmentidentifier = a.assessmentidentifier
	and aid.namespace = a.namespace
left join edfi.assessmentidentificationsystemdescriptor aisd
	on aisd.assessmentidentificationsystemdescriptorid = aid.assessmentidentificationsystemdescriptorid
left join edfi.descriptor dai
	on dai.descriptorid = aisd.assessmentidentificationsystemdescriptorid
-- assessment category --
left join edfi.assessmentcategorydescriptor acd
	on acd.assessmentcategorydescriptorid = a.assessmentcategorydescriptorid
left join edfi.descriptor dac
	on dac.descriptorid = acd.assessmentcategorydescriptorid
-- academic subject --
left join edfi.assessmentacademicsubject aas
	on aas.assessmentidentifier = a.assessmentidentifier
	and aas.namespace = a.namespace
left join edfi.descriptor das
	on das.descriptorid = aas.academicsubjectdescriptorid
-- assessed grade level --
left join edfi.assessmentassessedgradelevel aagl
	on aagl.assessmentidentifier = a.assessmentidentifier
	and aagl.namespace = a.namespace
left join edfi.descriptor dagl
	on dagl.descriptorid = aagl.gradeleveldescriptorid
-- assessment score --
left join edfi.assessmentscore ascore
	on ascore.assessmentidentifier = a.assessmentidentifier
	and ascore.namespace = a.namespace
left join edfi.descriptor darm
	on darm.descriptorid = ascore.assessmentreportingmethoddescriptorid
left join edfi.descriptor drdt
	on drdt.descriptorid = ascore.resultdatatypetypedescriptorid
-- assessment performance level --
left join edfi.assessmentperformancelevel apl
	on apl.assessmentidentifier = a.assessmentidentifier
	and apl.namespace = a.namespace
left join edfi.performanceleveldescriptor pld
	on pld.performanceleveldescriptorid = apl.performanceleveldescriptorid
left join edfi.descriptor dpl
	on dpl.descriptorid = pld.performanceleveldescriptorid
left join edfi.descriptor darm2
	on darm2.descriptorid = apl.assessmentreportingmethoddescriptorid
left join edfi.descriptor drdt2
	on drdt2.descriptorid = apl.resultdatatypetypedescriptorid
-- content standard --
left join edfi.assessmentcontentstandard acs
	on acs.assessmentidentifier = a.assessmentidentifier
	and acs.namespace = a.namespace
left join edfi.assessmentcontentstandardauthor acsa
	on acsa.assessmentidentifier = acs.assessmentidentifier
	and acsa.namespace = acs.namespace
left join edfi.descriptor dps
	on dps.descriptorid = acs.publicationstatusdescriptorid
left join edfi.educationorganization meo
	on meo.educationorganizationid = acs.mandatingeducationorganizationid
-- language --
left join edfi.assessmentlanguage al
	on al.assessmentidentifier = a.assessmentidentifier
	and al.namespace = a.namespace
left join edfi.descriptor dal
	on dal.descriptorid = al.languagedescriptorid
-- assessment period --
left join edfi.assessmentperiod ap
	on ap.assessmentidentifier = a.assessmentidentifier
	and ap.namespace = a.namespace
left join edfi.assessmentperioddescriptor apd
	on apd.assessmentperioddescriptorid = ap.assessmentperioddescriptorid
left join edfi.descriptor dap
	on dap.descriptorid = apd.assessmentperioddescriptorid
-- education organization reference --
left join edfi.educationorganization eo
	on eo.educationorganizationid = a.educationorganizationid
where a.namespace like '%%';

-----------------------------------
---- ASSESSMENT IDENTIFIER COUNT --
-----------------------------------

--SELECT COUNT(DISTINCT AssessmentIdentifier) AS DistinctAssessmentIdentifierCount
--FROM edfi.Assessment
--WHERE Namespace Like '%%'

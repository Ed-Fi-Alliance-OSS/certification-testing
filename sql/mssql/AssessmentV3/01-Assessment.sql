-------------------------
-- ASSESSMENT METADATA --
-------------------------

SELECT
	a.AssessmentTitle
	, darm.Description AS AssessmentReportingMethod
	, ascore.MinimumScore
	, ascore.MaximumScore
	, drdt.Description AS ResultDatatypeType
	, dpl.Description AS PerformanceLevel
	, darm2.Description AS AssessmentReportingMethod
	, apl.MinimumScore
	, apl.MaximumScore
	, drdt2.Description AS ResultDatatypeType
	, das.Description AS AcademicSubject
	, a.AssessmentIdentifier
	, a.Namespace
	, aid.IdentificationCode
	, dai.Description AS IdentificationCodeSystem
	, aid.AssigningOrganizationIdentificationCode
	, dac.Description AS AssessmentCategory
	, dagl.Description AS AssessedGradeLevel
	, acs.Title
	, acsa.Author
	, acs.Version
	, acs.URI
	, acs.PublicationDate
	, acs.PublicationYear
	, dps.Description AS PublicationStatusType
	, meo.NameOfInstitution As MandatingEducationOrganization
	, acs.BeginDate
	, acs.EndDate
	, a.AssessmentForm
	, dal.Description AS Language
	, a.RevisionDate
	, a.MaxRawScore
	, a.Nomenclature
	, dap.Description AS AssessmentPeriod
	, ap.BeginDate
	, ap.EndDate
	, eo.NameOfInstitution AS EducationOrganization
	, a.AdaptiveAssessment
FROM edfi.Assessment a
-- assessment identification code --
LEFT JOIN edfi.AssessmentIdentificationCode aid
	ON aid.AssessmentIdentifier = a.AssessmentIdentifier
	AND aid.Namespace = a.Namespace
LEFT JOIN edfi.AssessmentIdentificationSystemDescriptor aisd
	ON aisd.AssessmentIdentificationSystemDescriptorId = aid.AssessmentIdentificationSystemDescriptorId
LEFT JOIN edfi.Descriptor dai
	ON dai.DescriptorId = aisd.AssessmentIdentificationSystemDescriptorId
-- assessment category --
LEFT JOIN edfi.AssessmentCategoryDescriptor acd
	ON acd.AssessmentCategoryDescriptorId = a.AssessmentCategoryDescriptorId
LEFT JOIN edfi.Descriptor dac
	ON dac.DescriptorId = acd.AssessmentCategoryDescriptorId
-- academic subject --
LEFT JOIN edfi.AssessmentAcademicSubject aas
	ON aas.AssessmentIdentifier = a.AssessmentIdentifier
	AND aas.Namespace = a.Namespace
LEFT JOIN edfi.Descriptor das
	ON das.DescriptorId = aas.AcademicSubjectDescriptorId
-- assessed grade level --
LEFT JOIN edfi.AssessmentAssessedGradeLevel aagl
	ON aagl.AssessmentIdentifier = a.AssessmentIdentifier
	AND aagl.Namespace = a.Namespace
LEFT JOIN edfi.Descriptor dagl
	ON dagl.DescriptorId = aagl.GradeLevelDescriptorId
-- assessment score --
LEFT JOIN edfi.AssessmentScore ascore
	ON ascore.AssessmentIdentifier = a.AssessmentIdentifier
	AND ascore.Namespace = a.Namespace
LEFT JOIN edfi.Descriptor darm
	ON darm.DescriptorId = ascore.AssessmentReportingMethodDescriptorId
LEFT JOIN edfi.Descriptor drdt
	ON drdt.DescriptorId = ascore.ResultDatatypeTypeDescriptorId
-- assessment performance level --
LEFT JOIN edfi.AssessmentPerformanceLevel apl
	ON apl.AssessmentIdentifier = a.AssessmentIdentifier
	AND apl.Namespace = a.Namespace
LEFT JOIN edfi.PerformanceLevelDescriptor pld
	ON pld.PerformanceLevelDescriptorId = apl.PerformanceLevelDescriptorId
LEFT JOIN edfi.Descriptor dpl
	ON dpl.DescriptorId = pld.PerformanceLevelDescriptorId
LEFT JOIN edfi.Descriptor darm2
	ON darm2.DescriptorId = apl.AssessmentReportingMethodDescriptorId
LEFT JOIN edfi.Descriptor drdt2
	ON drdt2.DescriptorId = apl.ResultDatatypeTypeDescriptorId
-- content standard --
LEFT JOIN edfi.AssessmentContentStandard acs
	ON acs.AssessmentIdentifier = a.AssessmentIdentifier
	AND acs.Namespace = a.Namespace
LEFT JOIN edfi.AssessmentContentStandardAuthor acsa
	ON acsa.AssessmentIdentifier = acs.AssessmentIdentifier
	AND acsa.Namespace = acs.Namespace
LEFT JOIN edfi.Descriptor dps
	ON dps.DescriptorId = acs.PublicationStatusDescriptorId
LEFT JOIN Edfi.EducationOrganization meo
	ON meo.EducationOrganizationId = acs.MandatingEducationOrganizationId
-- language --
LEFT JOIN edfi.AssessmentLanguage al
	ON al.AssessmentIdentifier = a.AssessmentIdentifier
	AND al.Namespace = a.Namespace
LEFT JOIN edfi.Descriptor dal
	ON dal.DescriptorId = al.LanguageDescriptorId
-- assessment period --
LEFT JOIN edfi.AssessmentPeriod ap
	ON ap.AssessmentIdentifier = a.AssessmentIdentifier
	AND ap.Namespace = a.Namespace
LEFT JOIN edfi.AssessmentPeriodDescriptor apd
	ON apd.AssessmentPeriodDescriptorId = ap.AssessmentPeriodDescriptorId
LEFT JOIN edfi.Descriptor dap
	ON dap.DescriptorId = apd.AssessmentPeriodDescriptorId
-- education organization reference --
LEFT JOIN edfi.EducationOrganization eo
	ON eo.EducationOrganizationId = a.EducationOrganizationId
WHERE a.Namespace Like '%%'

-----------------------------------
---- ASSESSMENT IDENTIFIER COUNT --
-----------------------------------

--SELECT COUNT(DISTINCT AssessmentIdentifier) AS DistinctAssessmentIdentifierCount
--FROM edfi.Assessment
--WHERE Namespace Like '%%'

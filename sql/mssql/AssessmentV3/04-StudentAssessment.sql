------------------------
-- STUDENT ASSESSMENT --
------------------------

SELECT
	sa.StudentUSI
	, s.StudentUniqueId
	, sa.AdministrationDate
	, sasr.Result
	, drdt.Description AS ResultDatatype
	, darm.Description AS AssessmentReportingMethod
	, sapl.PerformanceLevelMet
	, dpl.Description AS PerformanceLevel
	, darm2.Description AS AssessmentReportingMethod
	, sa.StudentAssessmentIdentifier
	, sa.AssessmentIdentifier
	, sa.Namespace
	, dgl.Description AS WhenAssessedGradeLevel
	, sa.AdministrationEndDate
	, sa.SerialNumber
	, dal.Description AS AdministrationLanguage
	, dae.Description AS AdministrationEnvironment
	, dsaa.Description AS Accommodation
	, dri.Description AS RetestIndicator
	, drnt.Description AS ReasonNotTested
	, dect.Description AS EventCircumstance
	, sa.EventDescription
	, sa.CreateDate
FROM edfi.StudentAssessment sa
-- administration language --
LEFT JOIN edfi.Descriptor dal
	ON dal.DescriptorId = sa.AdministrationLanguageDescriptorId
-- administration environment --
LEFT JOIN edfi.Descriptor dae
	ON dae.DescriptorId = sa.AdministrationEnvironmentDescriptorId
-- accommodation --
LEFT JOIN edfi.StudentAssessmentAccommodation saa
	ON saa.StudentAssessmentIdentifier = sa.StudentAssessmentIdentifier
	AND saa.AssessmentIdentifier = sa.AssessmentIdentifier
	AND saa.Namespace = sa.Namespace
	AND saa.StudentUSI = sa.StudentUSI
LEFT JOIN edfi.Descriptor dsaa
	ON dsaa.DescriptorId = saa.AccommodationDescriptorId
-- retest indicator type --
LEFT JOIN edfi.Descriptor dri
	ON dri.DescriptorId = sa.RetestIndicatorDescriptorId
-- reason not tested type --
LEFT JOIN edfi.Descriptor drnt
	ON drnt.DescriptorId = sa.ReasonNotTestedDescriptorId
-- score result --
LEFT JOIN edfi.StudentAssessmentScoreResult sasr
	ON sasr.StudentAssessmentIdentifier = sa.StudentAssessmentIdentifier
	AND sasr.AssessmentIdentifier = sa.AssessmentIdentifier
	AND sasr.Namespace = sa.Namespace
	AND sasr.StudentUSI = sa.StudentUSI
LEFT JOIN edfi.Descriptor drdt
	ON drdt.DescriptorId = sasr.ResultDatatypeTypeDescriptorId
LEFT JOIN edfi.Descriptor darm
	ON darm.DescriptorId = sasr.AssessmentReportingMethodDescriptorId
-- when assessed grade level --
LEFT JOIN edfi.GradeLevelDescriptor gld
	ON gld.GradeLevelDescriptorId = sa.WhenAssessedGradeLevelDescriptorId
LEFT JOIN edfi.Descriptor dgl
	ON dgl.DescriptorId = gld.GradeLevelDescriptorId
-- performance level --
LEFT JOIN edfi.StudentAssessmentPerformanceLevel sapl
	ON sapl.StudentAssessmentIdentifier = sa.StudentAssessmentIdentifier
	AND sapl.AssessmentIdentifier = sa.AssessmentIdentifier
	AND sapl.Namespace = sa.Namespace
	AND sapl.StudentUSI = sa.StudentUSI
LEFT JOIN edfi.Descriptor dpl
	ON dpl.DescriptorId = sapl.PerformanceLevelDescriptorId
LEFT JOIN edfi.Descriptor darm2
	ON darm2.DescriptorId = sapl.AssessmentReportingMethodDescriptorId
-- event circumstance --
LEFT JOIN edfi.Descriptor dect
	ON dect.DescriptorId = sa.EventCircumstanceDescriptorId
LEFT JOIN edfi.Student s
	ON s.StudentUSI = sa.StudentUSI
WHERE sa.Namespace Like '%%'
	--AND s.StudentUniqueId IN ()

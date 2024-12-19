----------------------------------
-- STUDENT OBJECTIVE ASSESSMENT --
----------------------------------

SELECT
	saso.StudentUSI
	, s.StudentUniqueId
	, saso.IdentificationCode
	, sasos.Result
	, drdt.Description AS ResultDatatype
	, darm.Description AS AssessmentReportingMethod
	, sasop.PerformanceLevelMet
	, dpl.Description AS PerformanceLevel
	, darm2.Description AS AssessmentReportingMethod
	, saso.StudentAssessmentIdentifier
	, saso.AssessmentIdentifier
	, saso.Namespace
FROM edfi.StudentAssessmentStudentObjectiveAssessment saso
-- score result --
LEFT JOIN edfi.StudentAssessmentStudentObjectiveAssessmentScoreResult sasos ON sasos.StudentUSI = saso.StudentUSI
	AND sasos.StudentAssessmentIdentifier = saso.StudentAssessmentIdentifier
	AND sasos.AssessmentIdentifier = saso.AssessmentIdentifier
	AND sasos.Namespace = saso.Namespace
	AND sasos.IdentificationCode = saso.IdentificationCode
LEFT JOIN edfi.Descriptor drdt ON drdt.DescriptorId = sasos.ResultDatatypeTypeDescriptorId
LEFT JOIN edfi.Descriptor darm ON darm.DescriptorId = sasos.AssessmentReportingMethodDescriptorId
-- performance level --
LEFT JOIN edfi.StudentAssessmentStudentObjectiveAssessmentPerformanceLevel sasop ON sasop.StudentUSI = saso.StudentUSI
	AND sasop.StudentAssessmentIdentifier = saso.StudentAssessmentIdentifier
	AND sasop.AssessmentIdentifier = saso.AssessmentIdentifier
	AND sasop.Namespace = saso.Namespace
	AND sasop.IdentificationCode = saso.IdentificationCode
LEFT JOIN edfi.PerformanceLevelDescriptor pld ON pld.PerformanceLevelDescriptorId = sasop.PerformanceLevelDescriptorId
LEFT JOIN edfi.Descriptor dpl ON dpl.DescriptorId = pld.PerformanceLevelDescriptorId
LEFT JOIN edfi.Descriptor darm2 ON darm2.DescriptorId = sasop.AssessmentReportingMethodDescriptorId
JOIN edfi.Student s ON s.StudentUSI = saso.StudentUSI
WHERE saso.Namespace Like '%%'
	--AND s.StudentUniqueId IN ()

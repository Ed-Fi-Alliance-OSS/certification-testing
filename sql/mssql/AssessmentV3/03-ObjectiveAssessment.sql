-----------------------------------
-- OBJECTIVE ASSESSMENT METADATA --
-----------------------------------

SELECT
	oa.IdentificationCode
	, dpl.Description AS PerformanceLevel
	, darm.Description AS AssessmentReportingMethod
	, oapl.MinimumScore
	, oapl.MaximumScore
	, drdt.Description AS ResultDatatypeType
	, oa.MaxRawScore
	, ls.Description AS LearningStandard
	, oa.Namespace
	, oa.PercentOfAssessment
	, oa.Nomenclature
	, oa.Description
	, oaai.AssessmentItemIdentificationCode
	, lo.Objective
	, lo.Namespace AS LearningObjectiveNamespace
	, oa.ParentIdentificationCode
	, oa.AssessmentIdentifier
	, darm2.Description AS AssessmentReportingMethodType
	, oas.MinimumScore
	, oas.MaximumScore
	, drdt2.Description AS ResultDatatypeType
FROM edfi.ObjectiveAssessment oa
-- assessment performance level --
LEFT JOIN edfi.objectiveassessmentperformancelevel oapl
	ON oapl.AssessmentIdentifier = oa.AssessmentIdentifier
	AND oapl.Namespace = oa.Namespace
LEFT JOIN edfi.PerformanceLevelDescriptor pld
	ON pld.PerformanceLevelDescriptorId = oapl.PerformanceLevelDescriptorId
LEFT JOIN edfi.Descriptor dpl
	ON dpl.DescriptorId = pld.PerformanceLevelDescriptorId
LEFT JOIN edfi.Descriptor darm
	ON darm.DescriptorId = oapl.AssessmentReportingMethodDescriptorId
LEFT JOIN edfi.Descriptor drdt
	ON drdt.DescriptorId = oapl.ResultDatatypeTypeDescriptorId
-- assessment item reference --
LEFT JOIN edfi.ObjectiveAssessmentAssessmentItem oaai
	ON oaai.AssessmentItemIdentificationCode = oa.IdentificationCode
	AND oaai.AssessmentIdentifier = oa.AssessmentIdentifier
	AND oaai.Namespace = oa.Namespace
-- learning objective reference --
LEFT JOIN edfi.ObjectiveAssessmentLearningObjective oalo
	ON oalo.IdentificationCode = oa.IdentificationCode
	AND oalo.AssessmentIdentifier = oa.AssessmentIdentifier
	AND oalo.Namespace = oa.Namespace
LEFT JOIN edfi.LearningObjective lo
	ON lo.LearningObjectiveId = oalo.LearningObjectiveId
	AND lo.Namespace = oalo.Namespace
-- learning standard reference --
LEFT JOIN edfi.ObjectiveAssessmentLearningStandard oals
	ON oals.IdentificationCode = oa.IdentificationCode
	AND oals.Namespace = oa.Namespace
	AND oals.AssessmentIdentifier = oa.AssessmentIdentifier
LEFT JOIN edfi.LearningStandard ls
	ON ls.LearningStandardId = oals.LearningStandardId
-- assessment score --
LEFT JOIN edfi.ObjectiveAssessmentScore oas
	ON oas.IdentificationCode = oa.IdentificationCode
	AND oas.AssessmentIdentifier = oa.AssessmentIdentifier
	AND oas.Namespace = oa.Namespace
LEFT JOIN edfi.Descriptor darm2
	ON darm2.DescriptorId = oas.AssessmentReportingMethodDescriptorId
LEFT JOIN edfi.Descriptor drdt2
	ON drdt2.DescriptorId = oas.ResultDatatypeTypeDescriptorId
WHERE oa.Namespace Like '%%'

------------------------------------------------------
---- OBJECTIVE ASSESSMENT IDENTIFICATION CODE COUNT --
------------------------------------------------------

--SELECT COUNT(DISTINCT IdentificationCode) AS DistinctIdentificationCodeCount
--FROM edfi.ObjectiveAssessment
--WHERE Namespace Like '%%'

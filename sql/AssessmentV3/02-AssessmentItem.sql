------------------------------
-- ASSESSMENT ITEM METADATA --
------------------------------

SELECT
	ai.IdentificationCode
	, daic.Description AS AssessmentItemCategory
	, ai.MaxRawScore
	, ai.CorrectResponse
	, ls.Description AS LearningStandard
	, ai.AssessmentIdentifier
	, ai.Namespace
	, ai.ExpectedTimeAssessed
	, ai.Nomenclature
FROM edfi.AssessmentItem ai
-- assessment item cateogry --
LEFT JOIN edfi.Descriptor daic
	ON daic.DescriptorId = ai.AssessmentItemCategoryDescriptorId
-- learning standard --
LEFT JOIN edfi.AssessmentItemLearningStandard ails
	ON ails.AssessmentIdentifier = ai.AssessmentIdentifier
	AND ails.Namespace = ai.Namespace
LEFT JOIN edfi.LearningStandard ls
	ON ls.LearningStandardId = ails.LearningStandardId
WHERE ai.Namespace Like '%%'


-------------------------------------------------
---- ASSESSMENT ITEM IDENTIFICATION CODE COUNT --
-------------------------------------------------

--SELECT COUNT(DISTINCT IdentificationCode) AS DistinctIdentificationCodeCount
--FROM edfi.AssessmentItem
--WHERE Namespace Like '%%'

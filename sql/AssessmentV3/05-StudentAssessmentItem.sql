-----------------------------
-- STUDENT ASSESSMENT ITEM --
-----------------------------

SELECT
	sai.StudentUSI
	, s.StudentUniqueId
	, sai.IdentificationCode
	, sai.AssessmentResponse
	, dair.ShortDescription AS [AssessmentItemResultType]
	, sai.RawScoreResult
	, sai.Namespace
	, sai.StudentAssessmentIdentifier
	, sai.AssessmentIdentifier
	, sai.DescriptiveFeedback
	, dri.ShortDescription AS [ResponseIndicatorType]
	, sai.TimeAssessed
FROM edfi.StudentAssessmentItem sai
LEFT JOIN edfi.Descriptor dri ON dri.DescriptorId = sai.ResponseIndicatorDescriptorId
JOIN edfi.Descriptor dair ON dair.DescriptorId = sai.AssessmentItemResultDescriptorId
JOIN edfi.Student s ON s.StudentUSI = sai.StudentUSI
WHERE sai.Namespace LIKE '%%'
	--AND s.StudentUniqueId IN ('604917', '604863')
	--AND IdentificationCode LIKE '%Q:10'
	--AND s.StudentUniqueId = '604850'

--DELETE FROM edfi.StudentAssessmentItem WHERE StudentUSI = 31

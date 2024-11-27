------------------------------
-- ASSESSMENT ITEM METADATA --
------------------------------

select
	ai.identificationcode
	, daic.description as assessmentitemcategory
	, ai.maxrawscore
	, ls.description as learningstandard
	, ai.assessmentidentifier
	, ai.namespace
	, ai.expectedtimeassessed
	, ai.nomenclature
from edfi.assessmentitem ai
-- assessment item cateogry --
left join edfi.descriptor daic
	on daic.descriptorid = ai.assessmentitemcategorydescriptorid
-- learning standard --
left join edfi.assessmentitemlearningstandard ails
	on ails.assessmentidentifier = ai.assessmentidentifier
	and ails.namespace = ai.namespace
left join edfi.learningstandard ls
	on ls.learningstandardid = ails.learningstandardid
where ai.namespace like '%%';


-------------------------------------------------
---- ASSESSMENT ITEM IDENTIFICATION CODE COUNT --
-------------------------------------------------

--SELECT COUNT(DISTINCT IdentificationCode) AS DistinctIdentificationCodeCount
--FROM edfi.AssessmentItem
--WHERE Namespace Like '%%'

-----------
---Grade---
select dgt.codevalue as gradetypedescriptor
	 , g.lettergradeearned
	 , g.numericgradeearned
	 , gp.schoolid gradingperiodschoolid
	 , dgp.codevalue as gradingperioddescriptor
	 , gp.periodsequence
	 , gp.schoolyear as gradingperiodschoolyear
	 , ssa.begindate
	 , ssa.localcoursecode
	 , ssa.schoolid as studentsectionassociationschoolid
	 , syt.schoolyeardescription as studentsectionassociationschoolyear
	 , s.studentuniqueid
	 , ssa.sessionname
	 , ssa.sectionidentifier
from edfi.grade g
join edfi.gradetypedescriptor gtd on gtd.gradetypedescriptorid = g.gradetypedescriptorid
join edfi.descriptor dgt on dgt.descriptorid = gtd.gradetypedescriptorid
join edfi.gradingperiod gp on gp.gradingperioddescriptorid = g.gradingperioddescriptorid
	and gp.schoolid = g.schoolid
join edfi.gradingperioddescriptor gpd on gpd.gradingperioddescriptorid = gp.gradingperioddescriptorid
join edfi.descriptor dgp on dgp.descriptorid = gpd.gradingperioddescriptorid
join edfi.studentsectionassociation ssa on ssa.studentusi = g.studentusi
	and ssa.schoolid = g.schoolid
	and ssa.localcoursecode = g.localcoursecode
	and ssa.sectionidentifier = g.sectionidentifier
	and ssa.schoolyear = g.schoolyear
join edfi.schoolyeartype syt on syt.schoolyear = ssa.schoolyear
join edfi.student s on s.studentusi = ssa.studentusi
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));

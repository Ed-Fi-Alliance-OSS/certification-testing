-----------
---Staff---
select s.staffuniqueid
	 , s.firstname
	 , s.hispaniclatinoethnicity
	 , s.lastsurname
	 , s.birthdate
	 , s.generationcodesuffix
	 , dle.codevalue as highestcompletedlevelofeductaiondescriptor
	 , s.highlyqualifiedteacher
	 , s.middlename
	 --, S.PersonalTitlePrefix
	 , ds.codevalue sexdescriptor
	 , sem.electronicmailaddress
	 , demt.codevalue as electronicmailtypedescriptor
	 , sic.identificationcode
	 , dsis.codevalue as staffidentificationsystemdescriptor
	 , dr.codevalue as racedescriptor
from edfi.staff s
left join edfi.levelofeducationdescriptor led on led.levelofeducationdescriptorid = s.highestcompletedlevelofeducationdescriptorid
left join edfi.descriptor dle on dle.descriptorid = led.levelofeducationdescriptorid
left join edfi.sexdescriptor sd on sd.sexdescriptorid = s.sexdescriptorid
left join edfi.descriptor ds on ds.descriptorid = sd.sexdescriptorid
left join edfi.staffelectronicmail sem on sem.staffusi = s.staffusi
left join edfi.electronicmailtypedescriptor emtd on emtd.electronicmailtypedescriptorid = sem.electronicmailtypedescriptorid
left join edfi.descriptor demt on demt.descriptorid = emtd.electronicmailtypedescriptorid
left join edfi.staffidentificationcode sic on sic.staffusi = s.staffusi
left join edfi.staffidentificationsystemdescriptor sisd on sisd.staffidentificationsystemdescriptorid = sic.staffidentificationsystemdescriptorid
left join edfi.descriptor dsis on dsis.descriptorid = sisd.staffidentificationsystemdescriptorid
left join edfi.staffrace sr on sr.staffusi = s.staffusi
left join edfi.racedescriptor rd on rd.racedescriptorid = sr.racedescriptorid
left join edfi.descriptor dr on dr.descriptorid = rd.racedescriptorid
where (s.firstname = 'john' and s.lastsurname = 'loyo') or (s.firstname = 'jane' and s.lastsurname = 'smith');

-----------------------------------------------------
---StaffEducationOrganizationAssignmentAssociation---
select s.staffuniqueid
	 , seoaa.begindate
	 , seoaa.educationorganizationid
	 , dsc.codevalue as staffclassificationdescriptor
     , seoaa.enddate
	 , seoaa.positiontitle
from edfi.staffeducationorganizationassignmentassociation seoaa
join edfi.staff s on seoaa.staffusi = s.staffusi
join edfi.staffclassificationdescriptor scd on seoaa.staffclassificationdescriptorid = scd.staffclassificationdescriptorid
join edfi.descriptor dsc on dsc.descriptorid = scd.staffclassificationdescriptorid
where ((s.firstname = 'john' and s.lastsurname = 'loyo') or (s.firstname = 'jane' and s.lastsurname = 'smith'))
	and seoaa.educationorganizationid in (255901107,255901001);

----------------------------
---StaffSchoolAssociation---
select ssa.schoolid
	 , s.staffuniqueid
	 , das.codevalue as academicsubjectdescriptor
	 , dgl.codevalue as gradeleveldescriptor
from edfi.staffschoolassociation ssa
join edfi.staff s on s.staffusi = ssa.staffusi
left join edfi.staffschoolassociationacademicsubject ssaas on ssaas.staffusi = ssa.staffusi
	and ssaas.schoolid = ssa.schoolid
	and ssaas.programassignmentdescriptorid = ssa.programassignmentdescriptorid
left join edfi.academicsubjectdescriptor asd on asd.academicsubjectdescriptorid = ssaas.academicsubjectdescriptorid
left join edfi.descriptor das on das.descriptorid = asd.academicsubjectdescriptorid
left join edfi.staffschoolassociationgradelevel ssagl on ssagl.programassignmentdescriptorid = ssa.programassignmentdescriptorid
	and ssagl.schoolid = ssa.schoolid
	and ssagl.staffusi = ssa.staffusi
left join edfi.gradeleveldescriptor gld on gld.gradeleveldescriptorid = ssagl.gradeleveldescriptorid
left join edfi.descriptor dgl on dgl.descriptorid = gld.gradeleveldescriptorid
where ((s.firstname = 'john' and s.lastsurname = 'loyo') or (s.firstname = 'jane' and s.lastsurname = 'smith'))
	and ssa.schoolid in (255901107,255901001);

-----------------------------
---StaffSectionAssociation---
select se.localcoursecode
     , se.schoolid
	 , syt.schoolyeardescription
	 , se.sessionname
	 , se.sectionidentifier
	 , s.staffuniqueid
	 , dcp.codevalue as classroompositiondescriptor
	 , ssa.begindate
from edfi.staffsectionassociation ssa
join edfi.section se on se.schoolid = ssa.schoolid
	and se.localcoursecode = ssa.localcoursecode
	and se.schoolyear = ssa.schoolyear
	and se.sectionidentifier = ssa.sectionidentifier
	and se.sessionname = ssa.sessionname
join edfi.schoolyeartype syt on syt.schoolyear = se.schoolyear
join edfi.staff s on s.staffusi = ssa.staffusi
join edfi.classroompositiondescriptor cpd on cpd.classroompositiondescriptorid = ssa.classroompositiondescriptorid
join edfi.descriptor dcp on dcp.descriptorid = cpd.classroompositiondescriptorid
where ((s.firstname = 'john' and s.lastsurname = 'loyo') or (s.firstname = 'jane' and s.lastsurname = 'smith'));
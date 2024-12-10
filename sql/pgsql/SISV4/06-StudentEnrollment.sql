--------------------
---GraduationPlan---
select gp.educationorganizationid
	 , gp.graduationschoolyear
	 , gp.totalrequiredcredits
	 , dgpt.codevalue as graduationplantypedescriptor
from edfi.graduationplan gp
join edfi.graduationplantypedescriptor gptd on gptd.graduationplantypedescriptorid = gp.graduationplantypedescriptorid
join edfi.descriptor dgpt on dgpt.descriptorid = gptd.graduationplantypedescriptorid
where gp.educationorganizationid = 255901001;

------------------------------
---StudentSchoolAssociation---
select ssa.schoolid
	 , s.studentuniqueid
	 , gp.educationorganizationid as graduationplaneducationorganizationid
	 , gp.graduationschoolyear
	 , dgpt.codevalue as graduationplantype
	 , ssa.entrydate
	 , dgl.codevalue as entrygradeleveldescriptor
	 , csyt.schoolyeardescription as classofschoolyear
	 , syt.schoolyeardescription as schoolyear
	 , det.codevalue as entrytypedescriptor
	 , ssa.exitwithdrawdate
	 , dewt.codevalue as exitwithdrawtypedescriptor
	 , ssa.repeatgradeindicator
	 , drs.codevalue as residencystatusdescriptor
	 , ssa.schoolchoicetransfer
from edfi.studentschoolassociation ssa
join edfi.student s on s.studentusi = ssa.studentusi
left join edfi.graduationplan gp on gp.graduationplantypedescriptorid = ssa.graduationplantypedescriptorid
	and gp.educationorganizationid = ssa.educationorganizationid
	and gp.graduationschoolyear = ssa.graduationschoolyear
left join edfi.graduationplantypedescriptor gptd on gptd.graduationplantypedescriptorid = gp.graduationplantypedescriptorid
left join edfi.descriptor dgpt on dgpt.descriptorid = gptd.graduationplantypedescriptorid
join edfi.gradeleveldescriptor gld on gld.gradeleveldescriptorid = ssa.entrygradeleveldescriptorid
join edfi.descriptor dgl on dgl.descriptorid = gld.gradeleveldescriptorid
left join edfi.schoolyeartype csyt on csyt.schoolyear = ssa.classofschoolyear
left join edfi.schoolyeartype syt on syt.schoolyear = ssa.schoolyear
left join edfi.entrytypedescriptor etd on etd.entrytypedescriptorid = ssa.entrytypedescriptorid
left join edfi.descriptor det on det.descriptorid = etd.entrytypedescriptorid
left join edfi.exitwithdrawtypedescriptor ewtd on ewtd.exitwithdrawtypedescriptorid = ssa.exitwithdrawtypedescriptorid
left join edfi.descriptor dewt on dewt.descriptorid = ewtd.exitwithdrawtypedescriptorid
left join edfi.residencystatusdescriptor rsd on rsd.residencystatusdescriptorid = ssa.residencystatusdescriptorid
left join edfi.descriptor drs on drs.descriptorid = rsd.residencystatusdescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));

---------------------------------------------
---StudentEducationOrganizationAssociation---
select s.studentuniqueid
	 , seoa.educationorganizationid
	 , dlep.codevalue as limitedenglishproficiencydescriptor
	 , dsc.codevalue as studentcharacteristicdescriptor
	 , seoasi.indicatorname
	 , seoasi.indicator
	 , seoasic.assigningorganizationidentificationcode
	 , seoasic.identificationcode
	 , dsis.codevalue as studentidentificationsystemdescriptor
	 , ds.codevalue as sexdescriptor
	 , dat.codevalue as addresstypedescriptor
	 , sa.city
	 , sa.postalcode
	 , dasa.codevalue as stateabbreviationdescriptor
	 , sa.streetnumbername
	 , stp.telephonenumber
	 , dtnt.codevalue as telephonenumbertypedescriptor
	 , sem.electronicmailaddress
	 , demt.codevalue as electronicmailtypedescriptor
	 , seoa.hispaniclatinoethnicity
	 , dr.codevalue as racedescriptor
	 , dl.codevalue as languagedescriptor
	 , dlu.codevalue as languageusedescriptor
from edfi.studenteducationorganizationassociation seoa
join edfi.student s on s.studentusi = seoa.studentusi
join edfi.limitedenglishproficiencydescriptor lepd on seoa.limitedenglishproficiencydescriptorid = lepd.limitedenglishproficiencydescriptorid
join edfi.descriptor dlep on dlep.descriptorid  = lepd.limitedenglishproficiencydescriptorid
join edfi.studenteducationorganizationassociationstudentcharacteristic seoasc on seoasc.studentusi = s.studentusi
join edfi.descriptor dsc on dsc.descriptorid = seoasc.studentcharacteristicdescriptorid
left join edfi.studenteducationorganizationassociationstudentindicator seoasi on seoasi.studentusi = seoa.studentusi
and seoa.educationorganizationid = seoasi.educationorganizationid
left join edfi.studenteducationorganizationassociationstudentidentifica_c15030 seoasic on seoasic.studentusi = seoa.studentusi
	and seoasic.educationorganizationid = seoa.educationorganizationid
left join edfi.studentidentificationsystemdescriptor sisd
	on sisd.studentidentificationsystemdescriptorid = seoasic.studentidentificationsystemdescriptorid
left join edfi.descriptor dsis on dsis.descriptorid = sisd.studentidentificationsystemdescriptorid
join edfi.sexdescriptor sd on sd.sexdescriptorid = seoa.sexdescriptorid
join edfi.descriptor ds on ds.descriptorid = sd.sexdescriptorid
left join edfi.studenteducationorganizationassociationaddress sa on sa.studentusi = seoa.studentusi
	and sa.educationorganizationid = seoa.educationorganizationid
left join edfi.addresstypedescriptor atd on atd.addresstypedescriptorid = sa.addresstypedescriptorid
left join edfi.descriptor dat on dat.descriptorid = atd.addresstypedescriptorid
left join edfi.stateabbreviationdescriptor asad on asad.stateabbreviationdescriptorid = sa.stateabbreviationdescriptorid
left join edfi.descriptor dasa on dasa.descriptorid = asad.stateabbreviationdescriptorid
left join edfi.studenteducationorganizationassociationtelephone stp on stp.studentusi = seoa.studentusi
	and seoa.educationorganizationid = stp.educationorganizationid
left join edfi.telephonenumbertypedescriptor tntd on tntd.telephonenumbertypedescriptorid = stp.telephonenumbertypedescriptorid
left join edfi.descriptor dtnt on dtnt.descriptorid = tntd.telephonenumbertypedescriptorid
left join edfi.studenteducationorganizationassociationelectronicmail sem on sem.studentusi = seoa.studentusi
	and seoa.educationorganizationid = sem.educationorganizationid
left join edfi.electronicmailtypedescriptor emd on emd.electronicmailtypedescriptorid = sem.electronicmailtypedescriptorid
left join edfi.descriptor demt on demt.descriptorid = emd.electronicmailtypedescriptorid
left join edfi.studenteducationorganizationassociationrace sr on sr.studentusi = seoa.studentusi
	and seoa.educationorganizationid = sr.educationorganizationid
left join edfi.racedescriptor rd on rd.racedescriptorid = sr.racedescriptorid
left join edfi.descriptor dr on dr.descriptorid = rd.racedescriptorid
left join edfi.studenteducationorganizationassociationlanguage sl on sl.studentusi = seoa.studentusi
	and seoa.educationorganizationid = sl.educationorganizationid
left join edfi.languagedescriptor ld on ld.languagedescriptorid = sl.languagedescriptorid
left join edfi.descriptor dl on dl.descriptorid = ld.languagedescriptorid
left join edfi.studenteducationorganizationassociationlanguageuse slu on slu.languagedescriptorid = sl.languagedescriptorid
	and slu.studentusi = sl.studentusi
left join edfi.languageusedescriptor lud on lud.languageusedescriptorid = slu.languageusedescriptorid
left join edfi.descriptor dlu on dlu.descriptorid = lud.languageusedescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));

-------------------------------
---StudentSectionAssociation---
select se.localcoursecode
	 , se.schoolid
	 , syt.schoolyeardescription
	 , se.sectionidentifier
	 , se.sessionname
	 , s.studentuniqueid
	 , ssa.begindate
	 , ssa.enddate
	 , ssa.homeroomindicator
from edfi.studentsectionassociation ssa
join edfi.section se on se.schoolid = ssa.schoolid
	and se.localcoursecode = ssa.localcoursecode
	and se.schoolyear = ssa.schoolyear
	and se.sectionidentifier = ssa.sectionidentifier
join edfi.schoolyeartype syt on syt.schoolyear = se.schoolyear
join edfi.student s on s.studentusi = ssa.studentusi
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));

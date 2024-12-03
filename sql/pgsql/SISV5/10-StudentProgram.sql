-------------------------------
---StudentProgramAssociation---
select spa.begindate
	 , spa.educationorganizationid
	 , spa.programeducationorganizationid
	 , spa.programname
	 , dpt.codevalue as programtypedescriptor
	 , s.studentuniqueid
	 , spa.enddate
from edfi.generalstudentprogramassociation spa
join edfi.program p on p.programname = spa.programname
	and p.programtypedescriptorid = spa.programtypedescriptorid
	and p.educationorganizationid = spa.programeducationorganizationid
join edfi.programtypedescriptor ptd on ptd.programtypedescriptorid = p.programtypedescriptorid
join edfi.descriptor dpt on dpt.descriptorid = ptd.programtypedescriptorid
join edfi.student s on s.studentusi = spa.studentusi
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'))
	and dpt.codevalue in ('gifted and talented','career and technical education');


-----------------------------------------------
---StudentSpecialEducationProgramAssociation---
select ssepa.begindate
	 , ssepa.educationorganizationid
	 , ssepa.programname
	 , dpt.codevalue as programtypedescriptor
	 , ssepa.programeducationorganizationid
	 , dses.codevalue as specialeducationsettingdescriptor
	 , s.studentuniqueid
	 , ssepa.ideaeligibility
from edfi.studentspecialeducationprogramassociation ssepa
join edfi.generalstudentprogramassociation spa on spa.programeducationorganizationid = ssepa.programeducationorganizationid
	and spa.studentusi = ssepa.studentusi
	and spa.educationorganizationid = ssepa.educationorganizationid
	and spa.programtypedescriptorid = ssepa.programtypedescriptorid
	and spa.programname = ssepa.programname
	and spa.begindate = ssepa.begindate
join edfi.program p on p.programname = spa.programname
	and p.programtypedescriptorid = spa.programtypedescriptorid
	and p.educationorganizationid = spa.programeducationorganizationid
join edfi.programtypedescriptor ptd on ptd.programtypedescriptorid = p.programtypedescriptorid
join edfi.descriptor dpt on dpt.descriptorid = ptd.programtypedescriptorid 
left join edfi.specialeducationsettingdescriptor sesd 
	on sesd.specialeducationsettingdescriptorid = ssepa.specialeducationsettingdescriptorid
left join edfi.descriptor dses on dses.descriptorid = sesd.specialeducationsettingdescriptorid
join edfi.student s on s.studentusi = spa.studentusi
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));


-----------------------------------------------
---StudentTitleIPartAProgramAssociation---
select stipa.begindate
	 , stipa.educationorganizationid
	 , stipa.programname
	 , dpt.codevalue as programtypedescriptor
	 , stipa.programeducationorganizationid
	 , s.studentuniqueid
	 , dtipa.codevalue as titleipartaparticipantdescriptor
from edfi.studenttitleipartaprogramassociation stipa
join edfi.generalstudentprogramassociation spa on spa.programeducationorganizationid = stipa.programeducationorganizationid
	and spa.studentusi = stipa.studentusi
	and spa.educationorganizationid = stipa.educationorganizationid
	and spa.programtypedescriptorid = stipa.programtypedescriptorid
	and spa.programname = stipa.programname
	and spa.begindate = stipa.begindate
join edfi.program p on p.programname = spa.programname
	and p.programtypedescriptorid = spa.programtypedescriptorid
	and p.educationorganizationid = spa.programeducationorganizationid
join edfi.programtypedescriptor ptd on ptd.programtypedescriptorid = p.programtypedescriptorid
join edfi.descriptor dpt on dpt.descriptorid = ptd.programtypedescriptorid 
join edfi.student s on s.studentusi = spa.studentusi
join edfi.titleipartaparticipantdescriptor tipa on tipa.titleipartaparticipantdescriptorid = stipa.titleipartaparticipantdescriptorid
join edfi.descriptor dtipa on dtipa.descriptorid = tipa.titleipartaparticipantdescriptorid 
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));


----------------------------------
---StudentCTEProgramAssociation---
select scpa.begindate
	 , scpa.educationorganizationid
	 , scpa.programname
	 , dpt.codevalue as programtypedescriptor
	 , scpa.programeducationorganizationid
	 , s.studentuniqueid
	 , dcp.codevalue as careerpathwaydescriptor
	 , scpacp.cipcode
	 , scpacp.primarycteprogramindicator
	 , spa.enddate
	 , scpa.nontraditionalgenderstatus
	 , scpa.privatecteprogram
	 , dtsa.codevalue as technicalskillsassessmentdescriptor
from edfi.studentcteprogramassociation scpa
join edfi.generalstudentprogramassociation spa on spa.programeducationorganizationid = scpa.programeducationorganizationid
	and spa.studentusi = scpa.studentusi
	and spa.educationorganizationid = scpa.educationorganizationid
	and spa.programtypedescriptorid = scpa.programtypedescriptorid
	and spa.programname = scpa.programname
	and spa.begindate = scpa.begindate
join edfi.program p on p.programname = spa.programname
	and p.programtypedescriptorid = spa.programtypedescriptorid
	and p.educationorganizationid = spa.programeducationorganizationid
join edfi.programtypedescriptor ptd on ptd.programtypedescriptorid = p.programtypedescriptorid
join edfi.descriptor dpt on dpt.descriptorid = ptd.programtypedescriptorid 
join edfi.student s on s.studentusi = spa.studentusi
join edfi.studentcteprogramassociationcteprogram scpacp on scpacp.begindate = scpa.begindate
	and scpacp.educationorganizationid = scpa.educationorganizationid
	and scpacp.programeducationorganizationid = scpa.programeducationorganizationid
	and scpacp.programname = scpa.programname
	and scpacp.programtypedescriptorid = scpa.programtypedescriptorid
	and scpacp.studentusi = scpa.studentusi
join edfi.careerpathwaydescriptor cpd on cpd.careerpathwaydescriptorid = scpacp.careerpathwaydescriptorid
join edfi.descriptor dcp on dcp.descriptorid = cpd.careerpathwaydescriptorid
join edfi.technicalskillsassessmentdescriptor tsad on tsad.technicalskillsassessmentdescriptorid = scpa.technicalskillsassessmentdescriptorid
join edfi.descriptor dtsa on dtsa.descriptorid = tsad.technicalskillsassessmentdescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));


---------------------------------------
---StudentHomelessProgramAssociation---
select shpa.begindate
	 , shpa.educationorganizationid
	 , shpa.programname
	 , dpt.codevalue as programtypedescriptor
	 , shpa.programeducationorganizationid
	 , s.studentuniqueid
	 , dhps.codevalue as homelessprogramservicedescriptor
	 , shpas.servicebegindate
	 , shpas.primaryindicator
	 , dhpnr.codevalue as homelessprimarynighttimeresidencedescriptor
	 , shpa.awaitingfostercare
	 , shpa.homelessunaccompaniedyouth
from edfi.studenthomelessprogramassociation shpa
join edfi.generalstudentprogramassociation spa on spa.programeducationorganizationid = shpa.programeducationorganizationid
	and spa.studentusi = shpa.studentusi
	and spa.educationorganizationid = shpa.educationorganizationid
	and spa.programtypedescriptorid = shpa.programtypedescriptorid
	and spa.programname = shpa.programname
	and spa.begindate = shpa.begindate
join edfi.program p on p.programname = spa.programname
	and p.programtypedescriptorid = spa.programtypedescriptorid
	and p.educationorganizationid = spa.programeducationorganizationid
join edfi.programtypedescriptor ptd on ptd.programtypedescriptorid = p.programtypedescriptorid
join edfi.descriptor dpt on dpt.descriptorid = ptd.programtypedescriptorid 
join edfi.student s on s.studentusi = spa.studentusi
join edfi.studenthomelessprogramassociationhomelessprogramservice shpas on shpas.programeducationorganizationid = shpa.programeducationorganizationid
	and shpas.studentusi = shpa.studentusi
	and shpas.educationorganizationid = shpa.educationorganizationid
	and shpa.programtypedescriptorid = shpa.programtypedescriptorid
	and shpas.programname = shpa.programname
	and shpas.begindate = shpa.begindate
join edfi.homelessprogramservicedescriptor hpsd on hpsd.homelessprogramservicedescriptorid = shpas.homelessprogramservicedescriptorid
join edfi.descriptor dhps on dhps.descriptorid = hpsd.homelessprogramservicedescriptorid
join edfi.homelessprimarynighttimeresidencedescriptor hpnrd on hpnrd.homelessprimarynighttimeresidencedescriptorid = shpa.homelessprimarynighttimeresidencedescriptorid
join edfi.descriptor dhpnr on dhpnr.descriptorid = hpnrd.homelessprimarynighttimeresidencedescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));


--------------------------------------------------
---StudentLanguageInstructionProgramAssociation---
select slpa.begindate
	 , slpa.educationorganizationid
	 , slpa.programname
	 , dpt.codevalue as programtypedescriptor
	 , slpa.programeducationorganizationid
	 , s.studentuniqueid
	 , dp.codevalue as participationdescriptor
	 , dpr.codevalue as proficiencydescriptor
	 , dpg.codevalue as progressdescriptor
	 , dm.codevalue as monitoreddescriptor
	 , dlip.codevalue as languageinstructionprogramservicedescriptor
	 , slpa.englishlearnerparticipation
from edfi.studentlanguageinstructionprogramassociation slpa
join edfi.generalstudentprogramassociation spa on spa.programeducationorganizationid = slpa.programeducationorganizationid
	and spa.studentusi = slpa.studentusi
	and spa.educationorganizationid = slpa.educationorganizationid
	and spa.programtypedescriptorid = slpa.programtypedescriptorid
	and spa.programname = slpa.programname
	and spa.begindate = slpa.begindate
join edfi.program p on p.programname = spa.programname
	and p.programtypedescriptorid = spa.programtypedescriptorid
	and p.educationorganizationid = spa.programeducationorganizationid
join edfi.programtypedescriptor ptd on ptd.programtypedescriptorid = p.programtypedescriptorid
join edfi.descriptor dpt on dpt.descriptorid = ptd.programtypedescriptorid 
join edfi.student s on s.studentusi = spa.studentusi
join edfi.studentlanguageinstructionprogramassociationenglishlanguageproficiencyassessment slpaelp on slpaelp.programeducationorganizationid = slpa.programeducationorganizationid
	and slpaelp.studentusi = slpa.studentusi
	and slpaelp.educationorganizationid = slpa.educationorganizationid
	and slpaelp.programtypedescriptorid = slpa.programtypedescriptorid
	and slpaelp.programname = slpa.programname
	and slpaelp.begindate = slpa.begindate
join edfi.participationdescriptor pd on pd.participationdescriptorid = slpaelp.participationdescriptorid
join edfi.descriptor dp on dp.descriptorid = pd.participationdescriptorid
join edfi.proficiencydescriptor prd on prd.proficiencydescriptorid = slpaelp.proficiencydescriptorid
join edfi.descriptor dpr on dpr.descriptorid = prd.proficiencydescriptorid
join edfi.progressdescriptor pgd on pgd.progressdescriptorid = slpaelp.progressdescriptorid
join edfi.descriptor dpg on dpg.descriptorid = pgd.progressdescriptorid
join edfi.monitoreddescriptor md on md.monitoreddescriptorid = slpaelp.monitoreddescriptorid
join edfi.descriptor dm on dm.descriptorid = md.monitoreddescriptorid
join edfi.studentlanguageinstructionprogramassociationlanguageinstructionprogramservice slpas on slpas.programeducationorganizationid = slpa.programeducationorganizationid
	and slpas.studentusi = slpa.studentusi
	and slpas.educationorganizationid = slpa.educationorganizationid
	and slpas.programtypedescriptorid = slpa.programtypedescriptorid
	and slpas.programname = slpa.programname
	and slpas.begindate = slpa.begindate
join edfi.languageinstructionprogramservicedescriptor lipd on lipd.languageinstructionprogramservicedescriptorid = slpas.languageinstructionprogramservicedescriptorid
join edfi.descriptor dlip on dlip.descriptorid = lipd.languageinstructionprogramservicedescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));


----------------------------------
---StudentMigrantProgramAssociation---
select smpa.begindate
	 , smpa.educationorganizationid
	 , smpa.programname
	 , dpt.codevalue as programtypedescriptor
	 , smpa.programeducationorganizationid
	 , s.studentuniqueid
	 , smpa.priorityforservices
	 , smpa.lastqualifyingmove
	 , dcsr.codevalue as continuationofservicesreasondescriptor
	 , smpa.usinitialentry
	 , smpa.usmostrecententry
	 , smpa.usinitialschoolentry
	 , smpa.qualifyingarrivaldate
	 , smpa.stateresidencydate
	 , dmps.codevalue as migranteducationprogramservicedescriptor
from edfi.studentmigranteducationprogramassociation smpa
join edfi.generalstudentprogramassociation spa on spa.programeducationorganizationid = smpa.programeducationorganizationid
	and spa.studentusi = smpa.studentusi
	and spa.educationorganizationid = smpa.educationorganizationid
	and spa.programtypedescriptorid = smpa.programtypedescriptorid
	and spa.programname = smpa.programname
	and spa.begindate = smpa.begindate
join edfi.program p on p.programname = spa.programname
	and p.programtypedescriptorid = spa.programtypedescriptorid
	and p.educationorganizationid = spa.programeducationorganizationid
join edfi.programtypedescriptor ptd on ptd.programtypedescriptorid = p.programtypedescriptorid
join edfi.descriptor dpt on dpt.descriptorid = ptd.programtypedescriptorid 
join edfi.student s on s.studentusi = spa.studentusi
join edfi.continuationofservicesreasondescriptor csrd on csrd.continuationofservicesreasondescriptorid = smpa.continuationofservicesreasondescriptorid
join edfi.descriptor dcsr on dcsr.descriptorid = csrd.continuationofservicesreasondescriptorid
join edfi.studentmigranteducationprogramassociationmigranteducationprogramservice smpas on smpas.programeducationorganizationid = smpa.programeducationorganizationid
	and smpas.studentusi = smpa.studentusi
	and smpas.educationorganizationid = smpa.educationorganizationid
	and smpas.programtypedescriptorid = smpa.programtypedescriptorid
	and smpas.programname = smpa.programname
	and smpas.begindate = smpa.begindate
join edfi.migranteducationprogramservicedescriptor mpsd on mpsd.migranteducationprogramservicedescriptorid = smpas.migranteducationprogramservicedescriptorid
join edfi.descriptor dmps on dmps.descriptorid = mpsd.migranteducationprogramservicedescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));


----------------------------------
---StudentNeglectedOrDelinquentProgramAssociation---
select sndpa.begindate
	 , sndpa.educationorganizationid
	 , sndpa.programname
	 , dpt.codevalue as programtypedescriptor
	 , sndpa.programeducationorganizationid
	 , s.studentuniqueid
	 , dndp.codevalue as neglectedordelinquentprogramdescriptor
	 , depl.codevalue as elaprogressleveldescriptor
	 , dmpl.codevalue as mathematicsprogressleveldescriptor
	 , dndps.codevalue as neglectedordelinquentprogramservicedescriptor
	 , sndpas.servicebegindate
	 , sndpas.primaryindicator
from edfi.studentneglectedordelinquentprogramassociation sndpa
join edfi.generalstudentprogramassociation spa on spa.programeducationorganizationid = sndpa.programeducationorganizationid
	and spa.studentusi = sndpa.studentusi
	and spa.educationorganizationid = sndpa.educationorganizationid
	and spa.programtypedescriptorid = sndpa.programtypedescriptorid
	and spa.programname = sndpa.programname
	and spa.begindate = sndpa.begindate
join edfi.program p on p.programname = spa.programname
	and p.programtypedescriptorid = spa.programtypedescriptorid
	and p.educationorganizationid = spa.programeducationorganizationid
join edfi.programtypedescriptor ptd on ptd.programtypedescriptorid = p.programtypedescriptorid
join edfi.descriptor dpt on dpt.descriptorid = ptd.programtypedescriptorid 
join edfi.student s on s.studentusi = spa.studentusi
join edfi.neglectedordelinquentprogramdescriptor ndpd on ndpd.neglectedordelinquentprogramdescriptorid = sndpa.neglectedordelinquentprogramdescriptorid
join edfi.descriptor dndp on dndp.descriptorid = ndpd.neglectedordelinquentprogramdescriptorid
join edfi.progressleveldescriptor epld on epld.progressleveldescriptorid = sndpa.elaprogressleveldescriptorid
join edfi.descriptor depl on depl.descriptorid = epld.progressleveldescriptorid
join edfi.progressleveldescriptor mpld on epld.progressleveldescriptorid = sndpa.mathematicsprogressleveldescriptorid
join edfi.descriptor dmpl on dmpl.descriptorid = mpld.progressleveldescriptorid
join edfi.studentneglectedordelinquentprogramassociationneglectedordelinquentprogramservice sndpas on sndpas.programeducationorganizationid = sndpa.programeducationorganizationid
	and sndpas.studentusi = sndpa.studentusi
	and sndpas.educationorganizationid = sndpa.educationorganizationid
	and sndpas.programtypedescriptorid = sndpa.programtypedescriptorid
	and sndpas.programname = sndpa.programname
	and sndpas.begindate = sndpa.begindate
join edfi.neglectedordelinquentprogramservicedescriptor ndpsd on ndpsd.neglectedordelinquentprogramservicedescriptorid = sndpas.neglectedordelinquentprogramservicedescriptorid
join edfi.descriptor dndps on dndps.descriptorid = ndpsd.neglectedordelinquentprogramservicedescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));


----------------------------------
---StudentSchoolFoodServicesProgramAssociation---
select ssfpa.begindate
	 , ssfpa.educationorganizationid
	 , ssfpa.programname
	 , dpt.codevalue as programtypedescriptor
	 , ssfpa.programeducationorganizationid
	 , s.studentuniqueid
	 , dsfps.codevalue as schoolfoodserviceprogramservicedescriptor
from edfi.studentschoolfoodserviceprogramassociation ssfpa
join edfi.generalstudentprogramassociation spa on spa.programeducationorganizationid = ssfpa.programeducationorganizationid
	and spa.studentusi = ssfpa.studentusi
	and spa.educationorganizationid = ssfpa.educationorganizationid
	and spa.programtypedescriptorid = ssfpa.programtypedescriptorid
	and spa.programname = ssfpa.programname
	and spa.begindate = ssfpa.begindate
join edfi.program p on p.programname = spa.programname
	and p.programtypedescriptorid = spa.programtypedescriptorid
	and p.educationorganizationid = spa.programeducationorganizationid
join edfi.programtypedescriptor ptd on ptd.programtypedescriptorid = p.programtypedescriptorid
join edfi.descriptor dpt on dpt.descriptorid = ptd.programtypedescriptorid 
join edfi.student s on s.studentusi = spa.studentusi
join edfi.studentschoolfoodserviceprogramassociationschoolfoodserviceprogramservice ssfpas on ssfpas.programeducationorganizationid = ssfpa.programeducationorganizationid
	and ssfpas.studentusi = ssfpa.studentusi
	and ssfpas.educationorganizationid = ssfpa.educationorganizationid
	and ssfpas.programtypedescriptorid = ssfpa.programtypedescriptorid
	and ssfpas.programname = ssfpa.programname
	and ssfpas.begindate = ssfpa.begindate
join edfi.schoolfoodserviceprogramservicedescriptor sfpsd on sfpsd.schoolfoodserviceprogramservicedescriptorid = ssfpas.schoolfoodserviceprogramservicedescriptorid
join edfi.descriptor dsfps on dsfps.descriptorid = sfpsd.schoolfoodserviceprogramservicedescriptorid
where ((s.firstname = 'austin' and s.lastsurname = 'jones') or (s.firstname = 'madison' and s.lastsurname = 'johnson'));
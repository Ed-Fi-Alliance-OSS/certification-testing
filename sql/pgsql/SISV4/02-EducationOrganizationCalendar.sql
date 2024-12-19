------------------
---Calendar---
select	c.calendarcode
	,c.schoolid
	,c.schoolyear
	,dct.codevalue as calendartypedescriptor
	,dgl.codevalue as gradeleveldescriptor
from edfi.calendar c
join edfi.calendartypedescriptor ctd on ctd.calendartypedescriptorid = c.calendartypedescriptorid
join edfi.descriptor dct on dct.descriptorid = ctd.calendartypedescriptorid 
join edfi.calendargradelevel cgl on cgl.calendarcode = c.calendarcode
	and cgl.schoolid = c.schoolid
	and cgl.schoolyear = c.schoolyear
join edfi.descriptor dgl on dgl.descriptorid = cgl.gradeleveldescriptorid
where c.schoolid in (255901107,255901001);

------------------
---CalendarDate---
select cd.date
     , cd.calendarcode
	 , cd.schoolid
	 , cd.schoolyear
     , dce.codevalue as calendareventdescriptor
from edfi.calendardate cd
join edfi.calendardatecalendarevent cdce on cdce.schoolid = cd.schoolid 
	and cdce.date = cd.date
join edfi.calendareventdescriptor ced on ced.calendareventdescriptorid = cdce.calendareventdescriptorid
join edfi.descriptor dce on dce.descriptorid = ced.calendareventdescriptorid
where cd.schoolid in (255901107,255901001);

-------------------
---GradingPeriod---
select gp.schoolid
     , gp.schoolyear
	 , gp.begindate
	 , dgp.codevalue as gradingperioddescriptor
	 , gp.enddate
	 , gp.totalinstructionaldays
	 , gp.periodsequence
from edfi.gradingperiod gp   
join edfi.gradingperioddescriptor gpd on gp.gradingperioddescriptorid = gpd.gradingperioddescriptorid
join edfi.descriptor dgp on dgp.descriptorid = gpd.gradingperioddescriptorid
where gp.schoolid in (255901107,255901001)
	and dgp.codevalue in ('first six weeks','second six weeks');

-------------
---Session---
select s.schoolid
	 , syt.schoolyeardescription
	 , dt.codevalue as termdescriptor
	 , s.sessionname
	 , s.begindate
	 , s.enddate
	 , s.totalinstructionaldays
	 , gp.schoolid as gradingperiodschoolid
	 , dgp.codevalue as gradingperioddescriptor
	 , gp.periodsequence as gradingperiodperiodsequence
	 , gp.schoolyear as gradingperiodschoolyear
from edfi.session as s
join edfi.schoolyeartype syt on syt.schoolyear = s.schoolyear
join edfi.termdescriptor td on td.termdescriptorid = s.termdescriptorid
join edfi.descriptor dt on dt.descriptorid = td.termdescriptorid
join edfi.sessiongradingperiod sgp on sgp.schoolid = s.schoolid
	and sgp.schoolyear = s.schoolyear
join edfi.gradingperiod gp on gp.gradingperioddescriptorid = sgp.gradingperioddescriptorid
	and gp.schoolid = sgp.schoolid
	and gp.periodsequence = sgp.periodsequence
	and gp.schoolyear = sgp.schoolyear
join edfi.gradingperioddescriptor gpd on gpd.gradingperioddescriptorid = gp.gradingperioddescriptorid
join edfi.descriptor dgp on dgp.descriptorid = gpd.gradingperioddescriptorid
where s.schoolid in (255901107,255901001)
	and dt.codevalue = 'fall semester';
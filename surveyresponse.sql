select qkey,qval,time,survey.name,resource,uid from response join survey on response.sid=survey.id join questionnaire on questionnaire.id=survey.qid group by uid

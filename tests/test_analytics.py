import sys,unittest
from pathlib import Path
import pandas as pd
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from cleaning import clean_data
from safe_query import execute_plan
class AnalyticsTests(unittest.TestCase):
 def test_unavailable_sum_stays_missing(self):
  d=pd.DataFrame({'group':['a','a'],'value':[float('nan'),float('nan')]})
  for plan in [{'operation':'sum','field':'value'}, {'operation':'sum','field':'value','group_by':'group'}]:
   self.assertTrue(execute_plan(d,plan).value.isna().all())
 def test_chart_populations(self):
  from charts import recommend_charts
  d=pd.DataFrame({'group':['a','b',None]*50,'value':range(150),'other':range(150)})
  charts=recommend_charts(d,d.head(100).to_dict('records'))
  self.assertEqual(len(charts),4)
  self.assertEqual(sum(row['count'] for row in charts[0]['data']['values']),150)
  self.assertEqual(len(charts[1]['data']['values']),100)
  self.assertEqual(charts[1]['usermeta']['source_rows'],150)
  self.assertIn('First 100',charts[1]['usermeta']['scope'])
 def test_empty_rejected(self):
  with self.assertRaises(ValueError):clean_data(pd.DataFrame())
 def test_null_duplicates_and_column_collisions(self):
  d=pd.DataFrame([[None,1],[None,1]],columns=[' A ','a']);out,summary=clean_data(d)
  self.assertEqual(list(out),['a','a_2']);self.assertEqual(len(out),2);self.assertTrue(out.a.isna().all());self.assertEqual(summary['duplicate_rows_detected'],1)
 def test_closed_query_operations(self):
  d=pd.DataFrame({'group':['a','a','b'],'value':[2,3,5]})
  self.assertEqual(execute_plan(d,{'operation':'sum','field':'value','group_by':'group'}).value.tolist(),[5,5])
  with self.assertRaises(ValueError):execute_plan(d,{'operation':'__import__'})
  with self.assertRaises(ValueError):execute_plan(d,{'operation':'sum','field':'group'})
 def test_upload_and_bad_paths(self):
  import app,io,tempfile
  with tempfile.TemporaryDirectory() as tmp:
   old=app.UPLOAD_FOLDER;app.UPLOAD_FOLDER=tmp
   try:
    client=app.app.test_client()
    bad=client.post('/get_full_data',json={'filename':'../../secret.csv'});self.assertEqual(bad.status_code,400)
    reply=client.post('/clean_data',data={'file':(io.BytesIO(b'a,b\n1,2\n3,4\n'),'../../test.csv')})
    self.assertEqual(reply.status_code,200)
    name=reply.json['original_filename'];self.assertTrue(name.endswith('.csv'));self.assertNotIn('test',name)
    result=client.post('/nlp_query',json={'filename':name,'query':'count rows'})
    self.assertEqual(result.json['result'][0]['row_count'],2)
    self.assertEqual(client.post('/get_full_data',json=[]).status_code,400)
   finally:app.UPLOAD_FOLDER=old
if __name__=='__main__':unittest.main()

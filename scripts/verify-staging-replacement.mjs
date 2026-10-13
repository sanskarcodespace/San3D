import {createClient} from '@supabase/supabase-js';
import {chromium,expect} from '@playwright/test';
import sharp from 'sharp';
import {stagingConfig} from './staging-target.mjs';
// This exact fixture cleanup was approved on 13 October 2026. Not a general cleanup script.
if(!process.argv.includes('--approved-fixtures'))throw Error('Explicit fixture approval required');
// Obtain fresh human approval before starting session or fixture mutations.
if (!process.argv.includes("--approved-staging-state-changes"))
  throw new Error("Explicit approval for staging account/session and fixture changes is required.");
if (process.env.STAGING_ADMIN_EMAIL !== "admin-qa@example.test" || !process.env.STAGING_ADMIN_PASSWORD)
  throw new Error("Only the isolated staging administrator may run this script.");
const {url,key}=stagingConfig();
const api=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const categoryId='bb9f8ac7-7f35-460f-b583-3abe5db7ff0e';
const originalId='983e4513-96e7-4b0b-9799-3992fb18ef86';
const duplicateId='a45722ba-0381-492d-a9b3-d0c728318cfc';
const oldCategoryPath='catalogue/a9fb7dd9-c944-4d66-afc1-f30edaa4b645.webp';
let browser,step='login';
function check(ok,label){step=label;if(!ok)throw Error(label);console.log(`PASS ${label}`);}
try{
 const login=await api.auth.signInWithPassword({email:process.env.STAGING_ADMIN_EMAIL,password:process.env.STAGING_ADMIN_PASSWORD});check(!login.error,'staging session');
 const category=await api.from('categories').select('*').eq('id',categoryId).single();
 const duplicate=await api.from('products').select('*').eq('id',duplicateId).single();
 check(!category.error&&!duplicate.error&&category.data?.image_path===oldCategoryPath&&duplicate.data?.status==='draft'&&duplicate.data?.slug.startsWith('staging-lifecycle-'),'exact approved fixtures');
 browser=await chromium.launch();const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(20000);
 await page.goto('http://localhost:3200/admin/login');await page.getByLabel('Email',{exact:true}).fill(process.env.STAGING_ADMIN_EMAIL);await page.getByLabel('Password',{exact:true}).fill(process.env.STAGING_ADMIN_PASSWORD);await page.getByRole('button',{name:'Sign in to your studio'}).click();await page.getByRole('heading',{name:'Make room for ideas.'}).waitFor();
 const bytes=await sharp({create:{width:48,height:48,channels:3,background:'#334455'}}).webp().toBuffer();
 const file={name:'synthetic-replacement.webp',mimeType:'image/webp',buffer:bytes};
 step='category replacement UI';await page.goto('http://localhost:3200/admin/categories');
 const form=page.locator('form').filter({has:page.getByRole('heading',{name:category.data.name,exact:true})});
 await form.getByRole('button',{name:'Remove',exact:true}).click();await form.locator('input[type=file]').setInputFiles(file);await form.getByLabel('Image 1 alt text').fill('Replacement synthetic category tile');await form.getByRole('button',{name:'Save category',exact:true}).click();
 await expect.poll(async()=>(await api.from('categories').select('image_path').eq('id',categoryId).single()).data?.image_path).not.toBe(oldCategoryPath);
 await expect.poll(async()=>{
   const listing=await api.storage.from('catalogue-images').list('catalogue',{search:oldCategoryPath.split('/')[1]});
   return !listing.error && listing.data.length===0;
 }).toBe(true);
 const changed=await api.from('categories').select('image_path,image_alt').eq('id',categoryId).single();
 check(changed.data.image_alt==='Replacement synthetic category tile','category replacement persisted and approved old image deleted');
 console.log('Retained replacement category image:',changed.data.image_path);
 step='shared product replacement';await page.goto(`http://localhost:3200/admin/products/${originalId}`);
 const oldImages=await api.from('product_images').select('*').eq('product_id',originalId).order('display_order');
 check(!oldImages.error&&oldImages.data.length===2,'expected original fixture images');
 const replaced=oldImages.data[0].storage_path;
 await page.locator('.admin-image-row').first().getByRole('button',{name:'Remove',exact:true}).click();
 await page.locator('input[type=file]').setInputFiles(file);await page.getByLabel('Image 2 alt text').fill('Replacement synthetic product view');await page.getByRole('button',{name:'Save product',exact:true}).click();
 await expect.poll(async()=>(await api.from('product_images').select('storage_path').eq('product_id',originalId)).data?.some(i=>i.storage_path===replaced)).toBe(false);
 check(!(await api.storage.from('catalogue-images').info(replaced)).error,'shared image preserved during product replacement');
 await page.reload();check(await page.getByLabel('Image 2 alt text').inputValue()==='Replacement synthetic product view','product replacement persisted after reload');
 console.log('Retained original product images:',(await api.from('product_images').select('storage_path').eq('product_id',originalId)).data.map(i=>i.storage_path));
 step='approved duplicate deletion';await page.goto('http://localhost:3200/admin/products');
 const row=page.locator('article').filter({has:page.locator(`a[href="/admin/products/${duplicateId}"]`).first()});
 page.once('dialog',d=>d.accept());await row.getByRole('button',{name:'Delete',exact:true}).click();
 await expect.poll(async()=>(await api.from('products').select('id').eq('id',duplicateId)).data?.length).toBe(0);
 check((await api.from('product_images').select('id').eq('product_id',duplicateId)).data?.length===0,'approved duplicate deletion cascades image rows');
 check((await api.from('variants').select('id').eq('product_id',duplicateId)).data?.length===0,'approved duplicate deletion cascades variants');
 check((await api.from('products').select('status').eq('id',originalId).single()).data?.status==='archived','original archived product preserved');
 check(!(await api.storage.from('catalogue-images').info(replaced)).error,'original shared upload preserved after duplicate deletion');
 console.log('COMPLETE approved replacement/deletion checks. No additional cleanup performed.');
}catch(error){console.error(`FAIL at ${step}: ${error.name}`);process.exitCode=1;}
finally{await browser?.close();await api.auth.signOut({scope:'local'});}

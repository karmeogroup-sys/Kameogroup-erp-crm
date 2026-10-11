export type CompanyIdentity={legal_name:string;legal_form:string;share_capital:number;ncc:string;rccm:string;headquarters:string;landmark:string;phone:string;email:string};
export const defaultCompany:CompanyIdentity={legal_name:"KARMEO GROUP",legal_form:"SARLU",share_capital:1000000,ncc:"23 572 37-D",rccm:"CI-ABJ-03-2023-B13-03349",headquarters:"Abidjan, Cocody Palmeraie Akouédo",landmark:"Pharmacie Y4",phone:"+22585840263",email:"karmeogroup@gmail.com"};
export const companyAddress=(c:CompanyIdentity)=>[c.headquarters,c.landmark].filter(Boolean).join(", ");
export const companyLegalLine=(c:CompanyIdentity)=>[c.legal_name+" "+c.legal_form,"Capital : "+Number(c.share_capital||0).toLocaleString("fr-FR")+" FCFA","RCCM : "+c.rccm,"NCC : "+c.ncc,companyAddress(c),"Tél. : "+c.phone,c.email].filter(Boolean).join(" · ");
export function officialLogoUrl(sb:any){return sb?.storage.from("karmeo-brand").getPublicUrl("official-logo.png").data.publicUrl||""}

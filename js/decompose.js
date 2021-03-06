function validate(tri,V){
	//takes in a position array and an index triple
	//outputs if position triple the index triple points to is a valid TRI
	var A = V[tri[0]].clone().sub(V[tri[1]])
	var B = V[tri[2]].clone().sub(V[tri[1]])
	var C = new THREE.Vector3()

	var dot00 = A.dot(A)
	var dot01 = A.dot(B)
	var dot11 = B.dot(B)


	var ox = A.x
	A.x = -A.z
	A.z = ox
	if(A.dot(B)>=0){return false} //triangle has invalid wrapping
	A.z = -A.x
	A.x = ox
	for(var ii=0;ii<V.length;ii++){
		if(V[ii].distanceTo(V[tri[0]])==0){continue}
		if(V[ii].distanceTo(V[tri[1]])==0){continue}
		if(V[ii].distanceTo(V[tri[2]])==0){continue}
		C = V[ii].clone().sub(V[tri[1]])

		var dot02 = A.dot(C)
		var dot12 = B.dot(C)

		// Compute barycentric coordinates
		var invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
		var u = (dot11 * dot02 - dot01 * dot12) * invDenom
		var v = (dot00 * dot12 - dot01 * dot02) * invDenom
		// Check if point is in triangle
		if(((u >= 0) && (v >= 0) && (u + v < 1))){
			return false
		}
	}
	return true
}

function withinTri(point,tri){
	var A = tri[0].clone().sub(tri[1])
	var B = tri[2].clone().sub(tri[1])
	var C = point.clone().sub(tri[1])

	var dot00 = A.dot(A)
	var dot01 = A.dot(B)
	var dot11 = B.dot(B)

	var dot02 = A.dot(C)
	var dot12 = B.dot(C)

	// Compute barycentric coordinates
	var invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
	var u = (dot11 * dot02 - dot01 * dot12) * invDenom
	var v = (dot00 * dot12 - dot01 * dot02) * invDenom
	// Check if point is in triangle
	if(((u >= 0) && (v >= 0) && (u + v < 1))){
		return true
	}
	return false
}

function assureWrap(border){
	if(border[0]==border[border.length-1]){
		return false
	}else{
		border.push(border[0])
		return true
	}
}

function withinBorder(point,border){
	var temp = decompose_Shape(border)
	for(var ii=0;ii<temp.length;ii++){
		if(withinTri(point,[border[temp[ii][0]],border[temp[ii][1]],border[temp[ii][2]]])){
			return true
		}
	}
	return false
}

function validate_Shape(shape){
	//takes in a position path
	//outputs if it is a valid convex shape
	for(var ii=1;ii<shape.length-1;ii++){
		var A = shape[ii-1].clone().sub(shape[ii])
		var B = shape[ii+1].clone().sub(shape[ii])
		var ox = A.x
		A.x = -A.z
		A.z = ox
		if(A.dot(B)>=0){return false} //triangle has invalid wrapping
	}
	return true
}

function decompose_Shape(Target){
	//takes a position path in
	//outputs an array of index triples indicating a legal triangulation
	if(Target.length<3){
		return [];
	}

	var faces = []
	var nT = []
	var Ti = []

	nT.push(0)
	nT.push(1)
	nT.push(2)

	for(var ii=3;ii<Target.length;ii++){
		Ti.push(ii)
	}

	var safety = 100
	while(true){
		safety--
		if(safety<0){break}

		if(validate(nT,Target)){
			faces.push([nT[0],nT[1],nT[2]])

			nT[1] = nT[2]
		}else{
			Ti.push(nT[0])

			nT[0] = nT[1]
			nT[1] = nT[2]
		}

		if(Ti.length<1){
			break
		}

		nT[2] = Ti.splice(0,1)[0]

		if(nT.indexOf(undefined)>=0){
			break
		}
	}

	if(safety<0){console.log("Could not decompose surface")}
	return faces
}

function merge_Tris(Target, Positions){
	//takes in an array of index triples representing a triangulation and
	//	an array of positions
	//outputs
	for(var ii=0;ii<Target.length;ii++){
		Target[ii].push(Target[ii][0])
	}

	for(var ii=0;ii<Target.length-1;ii++){
		var merged = false

		for(var jj=ii+1;jj<Target.length;jj++){
			//find common edge
			for(var ii_kk = 0;ii_kk<Target[ii].length-1;ii_kk++){
				for(var jj_kk = 0;jj_kk<Target[jj].length-1;jj_kk++){
					if(Target[ii][ii_kk]==Target[jj][jj_kk+1] && Target[ii][ii_kk+1]==Target[jj][jj_kk]){
						//common edge!
						//create merged shape
						var sample_ii = Target[ii].slice(0,Target[ii].length-1)
						var sample_jj = Target[jj].slice(0,Target[jj].length-1)
						var shape = []
						for(var kk = ii_kk+1; kk!=ii_kk; kk++){
							if(kk>=sample_ii.length){
								if(ii_kk==0){break}
								kk = 0
							}
							shape.push(sample_ii[kk])
						}
						for(var kk = jj_kk+1; kk!=jj_kk; kk++){
							if(kk>=sample_jj.length){
								if(jj_kk==0){break}
								kk = 0
							}
							shape.push(sample_jj[kk])
						}
						var testshape = []
						for(var kk=0;kk<shape.length;kk++){
							testshape.push(Positions[shape[kk]])
						}
						testshape.push(Positions[shape[0]])
						testshape.push(Positions[shape[1]])
						if(validate_Shape(testshape)){
							shape.push(shape[0])
							Target[ii] = shape
							Target.splice(jj,1)
							merged = true
							break
						}
						//test if merged shape in concave
					}
				}
				if(merged){
					break
				}
			}
			if(merged){
				break
			}
		}
		if(merged){
			ii--
		}
	}

	for(var ii=0;ii<Target.length;ii++){
		Target[ii] = Target[ii].slice(0,Target[ii].length-1)
	}

	for(var ii=0;ii<Target.length;ii++){
		var last = Target[ii].length-2;
		var current = Target[ii].length-1;

		var end = Target[ii][Target[ii].length-1]
		var start = Target[ii][0]

		Target[ii].splice(Target[ii].length,0,start)
		Target[ii].splice(0,0,end)

		for(var jj=1;jj<Target[ii].length-1;jj++){

			//remove current if dot product is one
			var n = Positions[Target[ii][jj+1]].clone()
			var c = Positions[Target[ii][jj]].clone()
			var l = Positions[Target[ii][jj-1]].clone()

			var A = n.clone().sub(l)
			var B = c.clone().sub(l)

			if(A.x*B.x + A.z*B.z > .99999*A.length()*B.length()){
				Target[ii].splice(jj,1)
				jj--

				continue
			}
		}
		Target[ii].splice(Target[ii].length-1,1)
		Target[ii].splice(0,1)
	}


	return Target
}

src/category/_test_/
├─ category/
│  ├─ GetAllCategoriesNameImageCountCategory.spec.js   # Service (unit)
│  ├─ CategoryRepository.spec.js                       # Repository (unit)
│  ├─ categoryHandler.spec.js                          # Handler: happy/404/500
│  ├─ categoryHandler.branches.spec.js                 # Handler: ramas y bordes (incluye qs(null))
│  └─ categoryController.unit.spec.js                  # Controller (unit)
├─ models/
│  └─ categoryModel.spec.js                            # Model + DB mock
├─ hello/
│  └─ helloWord.spec.js                                # Lambda hello
├─ services/
│  └─ index.spec.js                                    # Smoke de services/index.js
